let notes = [];
let show_as_table = false;
const workspace = document.getElementById('workspace');

class NoteBox extends HTMLElement {
    static z_index = 0;
    static notes = [];
    static note_elements = [];
    static selected_note = null;
    static allow_interaction = true;

    constructor(title, items, background_colour) {
        super();
        this.attachShadow({ mode: 'open' });
        const template = document.getElementById('note-box');
        this.shadowRoot.appendChild(
            template.content.cloneNode(true)
        );
        this.title = title;
        this.items = items;
        this.title_element = this.shadowRoot.getElementById('title');
        this.list_element = this.shadowRoot.getElementById('item-list');
        this.background_colour = background_colour;
        this.style.backgroundColor = this.background_colour; 

        this.is_dragging = false;
        this.offsetX = 0;
        this.offsetY = 0;

        this.title_element.textContent = this.title;
        this.create_list(this.items);
        console.log(`** In NoteBox Constructor...\n** notes: ${NoteBox.notes.length}, note_elements: ${NoteBox.note_elements.length}`);
        this.addEventListener('mousedown', this.handle_mousedown.bind(this));
        document.addEventListener('mousemove', this.handle_mousemove.bind(this));
        document.addEventListener('mouseup', this.handle_mouseup.bind(this));
        this.style.transition = 'opacity 1s, transform 0.5s';
        this.addEventListener('click', this.handle_click);
    }

    connectedCallback() {
        console.log('\n** In connectedCallback()...');
        NoteBox.notes.push({title: this.title, items: this.items, background_colour: this.background_colour});
        NoteBox.note_elements.push(this);
        this.style.zIndex = ++NoteBox.z_index;
        this.handle_click();
        document.getElementById('stats').textContent = NoteBox.notes.length;
        console.log(`** notes: ${NoteBox.notes.length}, note_elements: ${NoteBox.note_elements.length}\n`);
    }

    disconnectedCallback() {
        console.log('\n** In disconnectedCallback()...');
        NoteBox.note_elements = NoteBox.note_elements.filter(ne => ne != this);
        NoteBox.notes = NoteBox.notes.filter(n => n.title != this.title);
        document.getElementById('stats').textContent = NoteBox.notes.length;
        console.log(`** After removal:- notes: ${NoteBox.notes.length}, note_elements: ${NoteBox.note_elements.length}\n`);
    }

    handle_click() {
        if (!NoteBox.allow_interaction) return;
        NoteBox.note_elements.forEach(elem => {
            elem.style.transform = 'scale(1)';
            elem.style.border = '3px solid var(--note-border-col)';
        });
        this.style.transform = 'scale(1.14)';
        this.style.border = '8px ridge var(--vibrant-col)';
        NoteBox.selected_note = this;
    }

    handle_mousedown(e) {
        if (!NoteBox.allow_interaction) return;
        this.is_dragging = true;
        const rect = this.getBoundingClientRect();
        this.offsetX = e.clientX - rect.x;
        this.offsetY = e.clientY - rect.y;
        this.style.zIndex = ++NoteBox.z_index;
        this.style.cursor = 'grabbing';
    }

    handle_mousemove(e) {
        if (!this.is_dragging || !NoteBox.allow_interaction) return;
        const x = e.clientX - this.offsetX;
        const y = e.clientY - this.offsetY;

        this.style.left = `${x}px`;
        this.style.top = `${y}px`;
    }

    handle_mouseup() {
        this.is_dragging = false;
        this.style.cursor = 'grab';
        // this.style.zIndex = 0;
    }

    create_list(items) {
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            this.list_element.appendChild(li);
        });
    }
}

function set_notes_opacity(opacity) {
    for (const note of notes) {
        note.style.opacity = Math.max(Math.min(opacity, 1), 0);
    }
}

customElements.define('note-box', NoteBox);

function show_toast(toast_id, text) {
    const toast = document.getElementById(toast_id);
    toast.innerText = text;
    toast.style.left = `${(toast.parentElement.getBoundingClientRect().width - toast.getBoundingClientRect().width) / 2}px`;
    toast.style.opacity = 1;
    setTimeout(_ => {
        toast.style.opacity = 0;
    }, 3000);
}

function create_notes_table(notes, max_item_count) {
    // `notes` should be an array of objects, each with the same set of keys (`title`, `items`, `background_colour`).
    // `title` should have a string value, `items` should be an array of up to `max_item_count` strings.
    // No validation done at present, up to the caller to pass in valid data!
    const table = document.createElement('table');
    table.style.border = '1px solid #000';
    table.id = 'notes_table';

    for (const note of notes) {
        const tr = table.insertRow();
        const td = tr.insertCell();
        td.style.color = '#000';
        td.style.backgroundColor = note.background_colour;
        td.appendChild(document.createTextNode(note.title));
        for (let i=0; i<max_item_count; i++) {
            const td = tr.insertCell();
            td.appendChild(document.createTextNode(note.items[i]));
        }
    }
    return table;
}

// Button listeners
const new_note_button = document.getElementById('new-note');
new_note_button.addEventListener('click', event => {
    set_notes_opacity(0.2);
    NoteBox.allow_interaction = false;  
    const template = document.getElementById('note-box-form');
    const div = document.createElement('div');
    div.appendChild(template.content.cloneNode(true));
    div.classList.add('form-wrapper');
    document.body.appendChild(div);
    div.style.zIndex = ++NoteBox.z_index;
    const form = div.querySelector('form');
    const title_field = form.querySelector('#title')
    title_field.focus();
    const cancel_button = div.querySelector('#cancel');
    const save_button = div.querySelector('#save');
    [save_button, cancel_button].forEach(button => {
        button.addEventListener('click', event => {
            switch(event.target.id) {
                case 'cancel':
                    div.remove();
                    break;
                case 'save':
                    const data = new FormData(form);
                    const title = data.get('title');
                    if (NoteBox.notes.map(note => note.title).includes(title)) {
                        alert("There's already a note with this title, so you may wish to change the title, or else cancel this and edit the original note instead...");
                        return;
                    }
                    const items = Array(6).fill(1).map((el, i) => data.get(`item_${i + 1}`)).filter(x => x);
                    div.remove();
                    const bg_colour = colours[rand_int(colour_count)];
                    const note = new NoteBox(title, items, bg_colour);
                    notes.push(note);
                    workspace.appendChild(note);
                    const workspace_rect = note.parentElement.getBoundingClientRect();
                    const note_rect = note.getBoundingClientRect();
                    const left = workspace_rect.left + 0.5 * (workspace_rect.width - note_rect.width);
                    const top = workspace_rect.top + 0.5 * (workspace_rect.height - note_rect.height); 
                    note.style.left = `${left}px`;
                    note.style.top = `${top}px`;
                    note.style.zIndex = ++NoteBox.z_index;
                    show_toast('toast', `Note ${title} created.`);
                    break;
                default:
                    console.log(`** Something else, not a button, was clicked - event targeted: ${event.target}.`);
            }
            set_notes_opacity(1.0);
            NoteBox.allow_interaction = true;  
        });
    });
});

const edit_note_button = document.getElementById('edit-note');
edit_note_button.addEventListener('click', event => {
    const note = NoteBox.selected_note;
    if (note === null) {
        show_toast('toast', 'No note selected to edit.');
        return;
    }
    set_notes_opacity(0.2);
    const template = document.getElementById('note-box-form');
    const div = document.createElement('div');
    div.appendChild(template.content.cloneNode(true));
    div.classList.add('form-wrapper');
    document.body.appendChild(div);
    div.style.zIndex = ++NoteBox.z_index;
    const form = div.querySelector('form');
    const title_field = form.querySelector('#title');
    title_field.value = NoteBox.selected_note.title;
    const items_fields = form.querySelectorAll('#list_items li input');
    let i = 0;
    items_fields.forEach(field => {
        field.value = NoteBox.selected_note.items[i++] ?? '';
    });
    title_field.focus();
    const cancel_button = div.querySelector('#cancel');
    const save_button = div.querySelector('#save');
    [save_button, cancel_button].forEach(button => {
        button.addEventListener('click', event => {
            switch(event.target.id) {
                case 'cancel':
                    div.remove();
                    break;
                case 'save':
                    const data = new FormData(form);
                    const title = data.get('title');
                    // if (NoteBox.notes.map(note => note.title).includes(title)) {
                    //     alert("There's already a note with this title, so you may wish to change the title or else cancel this and edit the original note instead...");
                    //     return;
                    // }
                    const items = Array(6).fill(1).map((el, i) => data.get(`item_${i + 1}`)).filter(x => x);
                    div.remove();
                    const bg_colour = colours[rand_int(colour_count)];
                    note.title = title;
                    note.items = items;

                    // HERE!   Note not updating, need to check logic here.

                    show_toast('toast', `Note ${title} saved.`);
                    break;
                default:
                    console.log(`** Something else, not a button, was clicked - event targeted: ${event.target}.`);
            }
            set_notes_opacity(1.0);
        });
    });
});

const save_button = document.getElementById('save-notes');
save_button.addEventListener('click', event => {
    const note_list = NoteBox.notes;
    localStorage.setItem('notes', JSON.stringify(note_list));
    console.log("** All notes saved.");
    show_toast('toast', 'All notes saved.');
});

async function save_to_file(data) {
    try {
        const newHandle = await window.showSaveFilePicker();
        const writableStream = await newHandle.createWritable();
        await writableStream.write(data);
        await writableStream.close();
    }
    catch (err) {
        console.error(err.name, err.message);
    }
  }

async function load_from_file() {
    let [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const data = await file.text();
    return data;
}

const save_to_file_button = document.getElementById('save-to-file');
save_to_file_button.addEventListener('click', event => {
    const note_list = NoteBox.notes;
    save_to_file(JSON.stringify(note_list));
    console.log("** All notes saved to file.");
    show_toast('toast', 'All notes saved to file.');
});

const random_button = document.getElementById('random');
random_button.addEventListener('click', event => {
    console.log(`** Generating ${RANDOM_COUNT} random notes...`);
    const workspace = document.getElementById('workspace');
    const workspace_rect = workspace.getBoundingClientRect();
    let indices = [];
    const some_titles = Array(RANDOM_COUNT).fill(1).map(x => {
        let index;
        do {
            index = rand_int(title_count);
        }
        while (indices.includes(index));
        indices.push(index);
        return titles[index];
    });
    for (title of some_titles) {
        const item_list = Array(rand_in_range(2, 7)).fill(0).map(item => `${entries[rand_int(item_count)]} ${entries[rand_int(item_count)]} ${Math.random() < 0.5 ? entries[rand_int(item_count)] : ''}`);
        const note = new NoteBox(title, item_list, colours[rand_int(colour_count)]);
        notes.push(note);
        workspace.appendChild(note);
        const note_rect = note.getBoundingClientRect();
        const x0 = workspace_rect.x + 8;
        const x1 = x0 + workspace_rect.width - note_rect.width - 8;
        const y0 = workspace_rect.y + 8;
        const y1 = y0 + workspace_rect.height - note_rect.height - 8;
        note.style.left = `${rand_in_range(x0, x1)}px`;
        note.style.top = `${rand_in_range(y0, y1)}px`;
    }
    show_toast('toast', `${RANDOM_COUNT} random notes generated.`);
});

const load_button = document.getElementById('load-notes');
load_button.addEventListener('click', event => {
    if (notes_str = localStorage.getItem('notes')) {
        console.log("** Loading notes from Local Storage...");
        const note_list = JSON.parse(notes_str);
        const workspace = document.getElementById('workspace');
        const workspace_rect = workspace.getBoundingClientRect();
        for (const entry of note_list) {
            const note = new NoteBox(entry.title, entry.items, entry.background_colour);
            notes.push(note);
            workspace.appendChild(note);
            const note_rect = note.getBoundingClientRect();
            const x0 = workspace_rect.x + 8;
            const x1 = x0 + workspace_rect.width - note_rect.width - 8;
            const y0 = workspace_rect.y + 8;
            const y1 = y0 + workspace_rect.height - note_rect.height - 8;
            note.style.left = `${rand_in_range(x0, x1)}px`;
            note.style.top = `${rand_in_range(y0, y1)}px`;
        }
        show_toast('toast', `${note_list.length} notes loaded.`);
    }
    else {
        console.log("No notes in Local Storage.");
        show_toast('toast', 'No notes to load from Local Storage.');
    }
});

const load_from_file_button = document.getElementById('load-from-file');
load_from_file_button.addEventListener('click', async function(event) {
    if (notes_str = await load_from_file()) {
        console.log("** Loading notes from file...");
        const note_list = JSON.parse(notes_str);
        const workspace_rect = workspace.getBoundingClientRect();
        for (const entry of note_list) {
            const note = new NoteBox(entry.title, entry.items, entry.background_colour);
            notes.push(note);
            workspace.appendChild(note);
            const note_rect = note.getBoundingClientRect();
            const x0 = workspace_rect.x + 8;
            const x1 = x0 + workspace_rect.width - note_rect.width - 8;
            const y0 = workspace_rect.y + 8;
            const y1 = y0 + workspace_rect.height - note_rect.height - 8;
            note.style.left = `${rand_in_range(x0, x1)}px`;
            note.style.top = `${rand_in_range(y0, y1)}px`;
        }
        show_toast('toast', `${note_list.length} notes loaded from file.`);
    }
    else {
        console.log("Unable to load notes.");
        show_toast('toast', 'Unable to load notes from file.');
    }
});

const clear_all_button = document.getElementById('clear-all');
clear_all_button.addEventListener('click', event => {
    localStorage.setItem('notes', '');
    console.log("** Clearing all notes from screen and Local Storage!");
    for (const note of notes) {
        note.remove();
    }
    NoteBox.notes = [];
    show_toast('toast', 'All notes cleared from screen and Local Storage.');
});

const delete_button = document.getElementById('delete-note');
delete_button.addEventListener('click', event => {
    const note = NoteBox.selected_note;
    if (note === null) {
        show_toast('toast', `No note selected to delete.`);
    }
    else {
        console.log(`\n** Before removal:- notes: ${NoteBox.notes.length}, note_elements: ${NoteBox.note_elements.length}\n`);
        note.remove();
        console.log(`** Note ${note.title} removed!`);
        NoteBox.selected_note = null;
        // Need also to remove from static lists and global list (in disconnectedCallback())
        show_toast('toast', `Note ${note.title} removed.`);
    }
});

const toggle_table_button = document.getElementById('toggle-table');
toggle_table_button.addEventListener('click', event => {
    if (show_as_table = !show_as_table) {
        set_notes_opacity(0);
        NoteBox.allow_interaction = false;
        const table = create_notes_table(NoteBox.notes, 6);
        workspace.appendChild(table);
    }
    else {
        set_notes_opacity(1);
        NoteBox.allow_interaction = true;
        workspace.querySelector('table').remove();
    }
});

// function hypocycloid(a, b, amp, t) {
//     const r = a - b;
//     const p = r / b;
//     return [
//         1.4 * amp * r * Math.sin(t) - b * Math.sin(p * t)
//     ]
// };



