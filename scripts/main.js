let notes = [];

class NoteBox extends HTMLElement {
    static z_index = 0;
    static notes = [];

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
        NoteBox.notes.push({title: this.title, items: this.items, background_colour: this.background_colour});

        this.addEventListener('mousedown', this.handle_mousedown.bind(this));
        document.addEventListener('mousemove', this.handle_mousemove.bind(this));
        document.addEventListener('mouseup', this.handle_mouseup.bind(this));
        this.style.transition = 'opacity 1s, transform 0.5s';
    }

    handle_mousedown(e) {
        this.is_dragging = true;
        const rect = this.getBoundingClientRect();
        this.offsetX = e.clientX - rect.x;
        this.offsetY = e.clientY - rect.y;
        this.style.zIndex = ++NoteBox.z_index;
        this.style.cursor = 'grabbing';
    }

    handle_mousemove(e) {
        if (!this.is_dragging) return;
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


// Button listeners
const new_note_button = document.getElementById('new-note');
new_note_button.addEventListener('click', event => {
    set_notes_opacity(0.2);
    const template = document.getElementById('note-box-form');
    const div = document.createElement('div');
    div.appendChild(template.content.cloneNode(true));
    div.classList.add('form-wrapper');
    document.body.appendChild(div);
    const form = div.querySelector('form');
    form.querySelector('#title').focus();
    const cancel_button = div.querySelector('#cancel');
    const create_button = div.querySelector('#create-note');
    [create_button, cancel_button].forEach(button => {
        button.addEventListener('click', event => {
            switch(event.target.id) {
                case 'cancel':
                    div.remove();
                    break;
                case 'create-note':
                        const data = new FormData(form);
                        const title = data.get('title');
                        if (NoteBox.notes.map(note => note.title).includes(title)) {
                            alert("There's already a note with this title, so you may wish to change the title or else cancel this and edit the original note instead...");
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
                        break;
                default:
                    console.log(`** Something else, not a button, was clicked - event targeted: ${event.target}.`);
            }
            set_notes_opacity(1.0);
        });
    });
});

const save_button = document.getElementById('save');
save_button.addEventListener('click', event => {
    const note_list = NoteBox.notes;
    localStorage.setItem('notes', JSON.stringify(note_list));
    console.log("** All notes saved.");
});

const random_button = document.getElementById('random');
random_button.addEventListener('click', event => {
    console.log(`** Generating ${RANDOM_COUNT} random notes...`);
    const workspace = document.getElementById('workspace');
    const workspace_rect = workspace.getBoundingClientRect();
    const some_titles = Array(RANDOM_COUNT).fill(1).map(x => titles[rand_int(title_count)]);
    for (title of some_titles) {
        const item_list = Array(rand_in_range(2, 11)).fill(0).map(item => entries[rand_int(item_count)]);
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
});

const load_button = document.getElementById('load');
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
    }
    else {
        console.log("No notes in Local Storage.");
    }
});

const clear_all_button = document.getElementById('clear-all');
clear_all_button.addEventListener('click', event => {
    localStorage.setItem('notes', '');
    console.log("** Clearing all notes from screen and Local Storage!!");
    for (const note of notes) {
        note.remove();
    }
    NoteBox.notes = [];
});

// function hypocycloid(a, b, amp, t) {
//     const r = a - b;
//     const p = r / b;
//     return [
//         1.4 * amp * r * Math.sin(t) - b * Math.sin(p * t)
//     ]
// };



