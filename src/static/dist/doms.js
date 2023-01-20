// for now this is just utilities for fields
class Field {
    static quick(tag, class_name, inner = null) {
        let el = document.createElement(tag);
        el.className = class_name;
        if (inner != null) {
            el.innerHTML = inner;
        }
        return el;
    }

    static example_values = ['A', 'B', 'C'];

    static dropdown(multiple = false, values = false) {
        let inner_input = Field.quick("select", "form-select");
        if (multiple) {
            inner_input.setAttribute('multiple', '');
        }
        values = values ? values : Field.example_values;
        // inner_input.setAttribute("multiple", "");
        for (let i of values) {
            let new_option = document.createElement("option");
            new_option.value = i;
            new_option.innerHTML = i;
            inner_input.appendChild(new_option);
        }
        return inner_input;
    }

    static checkbox_radio(multiple = true, values = false) {
        values = values ? values : Field.example_values;
        let inner_input = document.createElement("div");
        for (let i of values) {
            let new_option = Field.quick("div", "form-check input-view");

            let new_input = Field.quick("input", "form-check-input");
            new_input.type = multiple ? "checkbox" : "radio";
            new_input.value = i;
            new_input.id = `check-${i}`;

            let new_label = Field.quick('label', "form-check-label", i);
            new_label.setAttribute("for", `check-${i}`);

            new_option.appendChild(new_input);
            new_option.appendChild(new_label);
            inner_input.appendChild(new_option);
        }
        return inner_input;
    }

}
class MovingField {
    // Parent class for a form element that can move around
    // to use in the design of multiple choice elements and to view form fields of a schema
    
    constructor(idx) {
        // Each field will have an id and a label / title
        // This creates a div with, a label and three buttons: up, down and remove
        this.idx = idx;
        this.up = this.add_btn('up', 'arrow-up-circle', () => this.move_up());
        this.down = this.add_btn('down', 'arrow-down-circle', () => this.move_down());
        this.rem = this.add_btn('rem', 'trash', () => this.remove());
    }
    
    add_btn(className, symbol, action = false) {
        // Method to create a button, e.g. up, down, remove and edit
        let button_color = this.constructor.name == 'MovingViewer' ? 'btn-outline-primary' : 'btn-primary'
        let btn = Field.quick('button', `btn ${button_color} mover ${className}`);
        btn.id = `${className}-${this.idx}`;
        if (action) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                action();
            });    
        }
        
        let icon = Field.quick('i', `bi bi-${symbol}`);
        btn.appendChild(icon);
        return btn;
    }
    
}

class MovingViewer extends MovingField {
    // Specific class for viewing fields of a schema
    constructor(form, schema) {
        super(form.id);
        this.title = form.required ? form.title + '*' : form.title;
        this.repeatable = form.repeatable;
        this.div = Field.quick("div", "card border-primary viewer");
        this.div.id = form.id;
        this.body = form.viewer_input();
        let modal = bootstrap.Modal.getOrCreateInstance(document.getElementById(`mod-${form.id}-${form.schema_name}`));
        this.edit = this.add_btn('edit', 'pencil', () => modal.toggle());
        
        this.assemble();
        this.schema = schema;        
    }

    assemble() {
        let header = Field.quick('div', 'card-header mover-header');
        let header_title = document.createElement('h5');
        header_title.innerHTML = this.title;
        if (this.repeatable) {
            header_title.appendChild(Field.quick('i', 'bi bi-stack px-2'));
        }
        
        let header_buttons = Field.quick('div', 'btn-list');
        for (let button of [this.up, this.down, this.edit, this.rem]) {
            header_buttons.appendChild(button);
        }
        header.appendChild(header_title);
        header.appendChild(header_buttons);

        let body = Field.quick('div', 'card-body');
        body.appendChild(this.body);

        this.div.appendChild(header);
        this.div.appendChild(body);

    }

    // open_editor(modal) {
    //     modal.toggle();
    // }

    move_down() {
        // Method to move a viewing field downwards
        // It has an edit button and no working input field
        // The "input field" (with no effect) depends on the kind of field
        // this.below is defined in schema.js as the 'add element' button below it
        let form_index = this.schema.field_ids.indexOf(this.idx);
        let sibling = this.below.nextSibling; // element under the bottom button
        let sibling_button = sibling.nextSibling; // button under the bottom button
        
        this.div.parentElement.insertBefore(sibling, this.div);
        this.div.parentElement.insertBefore(sibling_button, this.div);
        if (!sibling.previousSibling.previousSibling.classList.contains("viewer")) {
            // if the other div went to first place        
            sibling.querySelector(".up").setAttribute("disabled", "");
            this.up.removeAttribute("disabled");
        }
        if (!this.below.nextSibling.classList.contains("viewer")) {
            // if this dev went to the last place
            sibling.querySelector(".down").removeAttribute("disabled");
            this.down.setAttribute("disabled", "")
        }
        
        this.schema.field_ids.splice(form_index, 1);
        this.schema.field_ids.splice(form_index + 1, 0, this.idx);
    }

    move_up() {
        // Method to move a viewing field upwards
        let form_index = this.schema.field_ids.indexOf(this.idx);
        let sibling = this.div.previousSibling.previousSibling;
        this.div.parentElement.insertBefore(this.div, sibling);
        this.div.parentElement.insertBefore(this.below, sibling);
        if (!this.div.previousSibling.previousSibling.classList.contains("viewer")) {
            // if this div went to first place
            this.up.setAttribute("disabled", "");
            sibling.querySelector(".up").removeAttribute("disabled");
        }
        if (!sibling.nextSibling.classList.contains("adder")) {
            // if we were in the last place
            this.down.removeAttribute("disabled");
            sibling.querySelector(".down").setAttribute("disabled", "")
        }
        this.schema.field_ids.splice(form_index, 1);
        this.schema.field_ids.splice(form_index - 1, 0, this.idx);
    }

    remove() {
        // Method to remove a viewing field (and thus also the field itself)
        let form_index = this.schema.field_ids.indexOf(this.idx);
        
        if (this.below.nextSibling.id == "col-12") {
            // if this is the last option
            this.div.previousSibling.previousSibling.querySelector(".down").setAttribute("disabled", "");
        }
        if (this.div.previousSibling.className == "form-control") {
            // if this was the first option
            this.below.nextSibling.querySelector(".up").setAttribute("disabled", "");
        }
        this.div.parentNode.removeChild(this.below);
        this.div.parentNode.removeChild(this.div);
        this.schema.field_ids.splice(form_index, 1);
    }

}

class MovingChoice extends MovingField {
    // Specific class for multiple choice editor
    // It has a working text input field and no edit button
    constructor(label_text, idx, value = false) {
        super(idx);
        this.label = BasicForm.labeller(label_text, `mover-${idx}`);
        this.div = Field.quick("div", "blocked");
        this.value = value;
        this.div.id = `block-${idx}`;
        this.input_tag = this.add_input();
        this.sub_div = Field.quick("div", "form-field");
        this.assemble();
    }

    assemble() {
        // General method to add label, remove button and others to the main div
        this.sub_div.appendChild(this.input_tag);
        this.sub_div.appendChild(this.up);
        this.sub_div.appendChild(this.down);
        this.sub_div.appendChild(this.rem);
        this.div.appendChild(this.label);
        this.div.appendChild(this.sub_div);
    }

    add_input() {
        // Method to create and add the text input field
        let input_tag = Field.quick("input", "form-control mover");
        input_tag.id = `mover-${this.idx}`;
        input_tag.name = `mover-${this.idx}`;
        input_tag.setAttribute('required', '');
        if (this.value) {
            input_tag.value = this.value;
        }
        return input_tag
    }
    
    move_down() {
        // Method to move the field down
        let sibling = this.div.nextSibling;
        this.div.parentElement.insertBefore(sibling, this.div);
        if (sibling.previousSibling.className !== "blocked") {
            // if the other div went to first place
            sibling.querySelector(".up").setAttribute("disabled", "");
            this.up.removeAttribute("disabled");
        }
        if (this.div.nextSibling.className !== "blocked") {
            // if this dev went to the last place
            sibling.querySelector(".down").removeAttribute("disabled");
            this.down.setAttribute("disabled", "")
        }
    }

    move_up() {
        // Method to move the field up
        let sibling = this.div.previousSibling;
        this.div.parentElement.insertBefore(this.div, sibling);
        if (this.div.previousSibling.className !== "blocked") {
            // if this div went to first place
            this.up.setAttribute("disabled", "");
            sibling.querySelector(".up").removeAttribute("disabled");
        }
        if (sibling.nextSibling.className !== "blocked") {
            // if we were in the last place
            this.down.removeAttribute("disabled");
            sibling.querySelector(".down").setAttribute("disabled", "")
        }
    }

    static remove_div(div) {
        // static method to remove a div element
        // (because this is also called programmatically to reset the form)
        if (div.nextSibling.id == "add-mover") {
            // if this is the last option
            div.previousSibling.querySelector(".down").setAttribute("disabled", "");
        }
        if (div.previousSibling.className == "form-control") {
            // if this was the first option
            div.nextSibling.querySelector(".up").setAttribute("disabled", "");
        }
        let existing_children = div.parentElement.querySelectorAll(".blocked");
        if (existing_children.length < 4) {
            existing_children.forEach((child) => {
                child.querySelector(".rem").setAttribute("disabled", "");
            });
        }
        
        div.parentNode.removeChild(div);
    }

    remove() {
        // Method to remove the field when clicking on the remove button
        MovingChoice.remove_div(this.div);
    }

}
// create a DOM object that is a form and has elements
class BasicForm {
    constructor(id) {
        this.form = Field.quick("form", "m-3 needs-validation");
        this.form.id = `form-${id}`;
        this.form.setAttribute('novalidate', '')
        this.option_indices = [];
    }

    static labeller(label_text, input_id) {
        let label = Field.quick("label", "form-label h6", label_text);
        label.id = `label-${input_id}`;
        label.setAttribute("for", input_id);

        return label;
    }

    add_input(label_text, input_id, {
        description = false, placeholder = "Some text",
        value = false, validation_message = "This field is compulsory",
        pattern = ".*"
        } = {}) {
        // Create and append a required text input
        let input_tag = Field.quick("input", "form-control");
        input_tag.id = input_id;
        input_tag.name = input_id;
        input_tag.type = "text";
        input_tag.pattern = pattern;
        input_tag.placeholder = placeholder;
        input_tag.setAttribute("required", "")
        if (value) {
            input_tag.value = value;
        }
        // input_tag.addEventListener('input', () => {
        //     if (input_tag.validity.valueMissing) input_tag.reportValidity();
        // })
        let label = BasicForm.labeller(label_text, input_id)

        let validator = Field.quick('div', 'invalid-feedback', validation_message);

        let input_div = Field.quick('div', 'mb-3 form-container');
        input_div.id = 'div-' + input_id;
        input_div.appendChild(label);
        input_div.appendChild(input_tag);

        if (description) {
            let input_desc = Field.quick('div', 'form-text', description);
            input_desc.id = 'help-' + input_id;
            input_div.appendChild(input_desc);
        }

        input_div.appendChild(validator);

        if (this.form.childNodes.length == 0 || this.form.lastChild.classList.contains('form-container')) {
            // the second part checks that the last element is not the submit button (or div with, in this case)
            this.form.appendChild(input_div);
        } else {
            let br = this.form.querySelector('br');
            this.form.insertBefore(input_div, br);
        }
    }

    add_select(label_text, select_id, options, selected = false) {
        // Create an append a selection object
        let select = Field.quick("select", "form-select");
        select.ariaLabel = "Select typing input type"
        select.id = select_id;
        select.name = select_id;
        if (!selected) {
            selected = options[0];
        }

        options.forEach((option) => {
            let new_option = document.createElement("option");
            new_option.value = option;
            new_option.innerHTML = option;
            if (option == selected) {
                new_option.setAttribute("selected", "")
            }
            select.appendChild(new_option);
        });

        let input_div = Field.quick('div', 'mb-3 form-container');
        input_div.appendChild(BasicForm.labeller(label_text, select_id));
        input_div.appendChild(select);
        this.form.appendChild(input_div);
    }

    add_mover(label_text, idx, value = false) {
        // Create a moving field for the selection editor
        let input = new MovingChoice(label_text, idx, value).div;
        if (idx < 2) {
            input.querySelector(".rem").setAttribute("disabled", "");    
        }
        this.option_indices.push(idx);
        return input;
    }

    add_moving_options(label_text, starting_values = []) {
        // List the first two moving fields (or existing fields) in the selection editor
        // And with a plus button to keep adding
        let options = starting_values;
        let has_values = options.length > 0;
        if (!has_values) {
            options = [0, 1];
        }

        for (let i in options) {
            let input = this.add_mover(label_text, i,
                has_values ? options[i] : false);
            if (i == 0) {
                input.querySelector(".up").setAttribute("disabled", "");
            }
            if (i == options.length - 1) {
                input.querySelector(".down").setAttribute("disabled", "");
            }
            this.form.appendChild(input);
        }
        
        let plus_div = Field.quick('div', 'd-grid gap-2 mover mt-2');
        let plus = Field.quick("button", "btn btn-primary btn-sm", "Add option");
        plus.type = "button";
        plus.id = 'add-mover';
        plus.addEventListener('click', (e) => {
            e.preventDefault();
            let current_max = Math.max(...this.option_indices);
            
            let new_input = this.add_mover(label_text, current_max + 1);
            new_input.querySelector(".down").setAttribute("disabled", "");

            this.form.insertBefore(new_input, plus.parentNode);
            new_input.previousSibling.querySelector(".down").removeAttribute("disabled");

            let existing_children = this.form.querySelectorAll(".blocked");
            if (existing_children.length >= 2) {
                existing_children.forEach((child) => {
                    child.querySelector(".rem").removeAttribute("disabled");
                }
                );
            }
        });
        plus_div.appendChild(plus);
        
       this.form.appendChild(plus_div);
    }

    add_switches(id, switchnames = ['required', 'repeatable'],
    {required = false, repeatable = false, dropdown = false} = {}) {
        // Add a radio switch to select a field as required
        // I'm adding the radio switch for "repeatable" and "dropdown" here as well
        // For multiple choice fields, add 'dropdown' to switchnames and the Object.
        let div = Field.quick("div", "col-3 mt-2");
        let subdiv = Field.quick("div", "form-check form-switch form-check-inline");
        
        let switches = {
            'required' : { 'id' : 'required', 'text' : 'Require', 'value' : required },
            'repeatable' : { 'id' : 'repeatable', 'text' : 'Make repeatable', 'value' : repeatable },
            'dropdown' : { 'id' : 'dropdown', 'text' : 'As dropdown', 'value' : dropdown}
        }

        for (let sname of switchnames) {
            let sw = switches[sname];
            let label = Field.quick("label", "form-check-label", sw.text);
            label.id = `label-${id}-${sw.id}`;
            label.setAttribute('for', `${sw.id}-${id}`);
    
            let input = Field.quick("input", "form-check-input");
            input.type = "checkbox";
            input.role = "switch"
            input.id = `${id}-${sw.id}`;
            if (sw.value) {
                input.setAttribute('checked', '');
            }
    
            subdiv.appendChild(label);
            subdiv.appendChild(input);
        }
        
        div.appendChild(subdiv);
        this.form.appendChild(div);
    }

    add_submitter(submit_text) {
        let div = Field.quick("div", "col-6 mt-3");
        let button = Field.quick("button", "btn btn-success", submit_text);
        button.type = "submit";
        div.appendChild(button);
        this.form.appendChild(div);
    }

    add_submit_action(action) {
        this.form.querySelector("[type='submit']").addEventListener('click', action);
    }

    reset() {
        this.form.reset();
        let checkboxes = this.form.querySelectorAll('[type="checkbox"]');
        for (let checkbox of checkboxes) {
            checkbox.removeAttribute('checked');
        }
        this.form.classList.remove('was-validated');
    }
    
}

// create a modal - needs both the constructor and .create_modal()
class Modal {
    constructor(modal_id, header_title, header_id) {
        this.id = modal_id;
        this.header_title = header_title;
        this.header_id = header_id;
    }

    create_header() {
        let modal_header = Field.quick("div", "modal-header");
        
        let modal_title = Field.quick("h5", "modal-title", this.header_title, this.header_id);
        
        let modal_close = Field.quick("button", "btn-close");
        modal_close.setAttribute("data-bs-dismiss", "modal");
        modal_close.ariaLabel = "Close";
        modal_header.appendChild(modal_title);
        modal_header.appendChild(modal_close);

        return modal_header;
    }

    create_body(body_contents) {
        // content has to be a node to append
        let modal_body = Field.quick("div", "modal-body");
        body_contents.forEach((x) => modal_body.appendChild(x));
        
        return modal_body;
    }

    create_footer() {
        let modal_footer = Field.quick("div", "modal-footer");
        
        let footer_close = Field.quick("button", "btn btn-secondary", "Cancel");
        footer_close.type = "button";
        footer_close.setAttribute("data-bs-dismiss", "modal");
        
        // let footer_save = Field.quick("button", "btn btn-primary submit", "Submit");
        // footer_save.type = "button";

        modal_footer.appendChild(footer_close);
        // modal_footer.appendChild(footer_save);

        return modal_footer;
    }

    create_modal(body_contents, size = null) {
        let modal = Field.quick("div", "modal");
        modal.id = this.id;
        modal.tabIndex = "-1";
        modal.role = "dialog";
        
        let modal_dialog = Field.quick("div", size == null ? "modal-dialog" : `modal-dialog modal-${size}`);
        
        let modal_content = Field.quick("div", "modal-content");

        let modal_header = this.create_header();
        
        let modal_body = this.create_body(body_contents);
        
        let modal_footer = this.create_footer();
        
        modal_content.appendChild(modal_header);
        modal_content.appendChild(modal_body);
        modal_content.appendChild(modal_footer);

        modal_dialog.appendChild(modal_content);
        modal.appendChild(modal_dialog);

        document.querySelector("body").appendChild(modal);
    }

}

class AccordionItem {
	constructor(id, header_title, accordion, is_new = false) {
		this.id = id;
		this.parent = accordion;
		this.header_title = header_title;
		this.div = Field.quick('div', 'accordion-item');
		this.new = is_new;
		this.create();
	}
	create() {
		let header = Field.quick('div', 'accordion-header');
		header.id = this.id + '-header';
		let header_button = Field.quick('button', this.new ? 'btn btn-primary m-2' : 'accordion-button h4', this.header_title);
        header_button.type = 'button'
		header_button.setAttribute('data-bs-toggle', 'collapse');
		header_button.setAttribute('data-bs-target', '#' + this.id)
		header_button.ariaControls = this.id;
		header.appendChild(header_button);
		
		let body = Field.quick('div', 'accordion-collapse collapse');
		body.id = this.id;
		body.setAttribute('aria-labelledby', this.id + '-header');
		body.setAttribute('data-bs-parent', '#' + this.parent);
        this.card_body = Field.quick('div', 'accordion-body');
        body.appendChild(this.card_body);

		this.div.appendChild(header);
		this.div.appendChild(body);
		
        this.collapse = new bootstrap.Collapse(body, { toggle: false });
	}

	append(element, i = null) {
        let elements = this.card_body.childNodes;
        if (i == null || i >= elements.childNodes.length - 1) {
            this.card_body.appendChild(element);
        } else {
            this.card_body.insertBefore(element, elements[i+1]);
        }
	}
    
    toggle() {
        this.collapse.toggle();
    }
}
