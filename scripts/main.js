let notes = [];

class NoteBox extends HTMLElement {
    static z_index = 0;
    constructor(title, items) {
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

        this.is_dragging = false;
        this.offsetX = 0;
        this.offsetY = 0;

        this.title_element.textContent = this.title;
        this.create_list(this.items);

        this.addEventListener('mousedown', this.handle_mousedown.bind(this));
        document.addEventListener('mousemove', this.handle_mousemove.bind(this));
        document.addEventListener('mouseup', this.handle_mouseup.bind(this));
        this.style.transition = 'opacity 3s ease-in-out';
    }

    handle_mousedown(e) {
        this.is_dragging = true;
        const rect = this.getBoundingClientRect();
        console.info("\n*** In handle_mousedown...\n");
        console.table(rect);
        this.offsetX = e.clientX - rect.x;
        this.offsetY = e.clientY - rect.y;
        console.table({'this.offsetX': this.offsetX, 'this.offsetY': this.offsetY, 'e.clientX': e.clientX, 'e.clientY': e.clientY});
        this.style.zIndex = ++NoteBox.z_index;
        this.style.cursor = 'grabbing';
    }

    handle_mousemove(e) {
        if (!this.is_dragging) return;
        // This logic needs careful checking, as boxes can shift once mousemove starts.
        console.info("\n*** In handle_mousemove...\n");
        console.table({'this.offsetX': this.offsetX, 'this.offsetY': this.offsetY, 'e.clientX': e.clientX, 'e.clientY': e.clientY});
        const x = e.clientX - this.offsetX;
        const y = e.clientY - this.offsetY;

        this.style.left = `${x}px`;
        this.style.top = `${y}px`;
        console.table({'this.style.left': this.style.left, 'this.style.top': this.style.top});
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

customElements.define('note-box', NoteBox);

// For debugging, create a load of notes in random positions
const workspace = document.getElementById('workspace');
const workspace_rect = workspace.getBoundingClientRect();
for (title of titles) {
    const item_list = Array(rand_in_range(2, 11)).fill(0).map(item => entries[rand_int(item_count)]);
    const note = new NoteBox(title, item_list);
    notes.push(note);
    note.style.backgroundColor = colours[rand_int(colour_count)];
    workspace.appendChild(note);
    const note_rect = note.getBoundingClientRect();
    const x0 = workspace_rect.x + 8;
    const x1 = x0 + workspace_rect.width - note_rect.width - 8;
    const y0 = workspace_rect.y + 8;
    const y1 = y0 + workspace_rect.height - note_rect.height - 8;
    note.style.left = `${rand_in_range(x0, x1)}px`;
    note.style.top = `${rand_in_range(y0, y1)}px`;
    // console.log(`Note ${title}: top left: (${note.style.left}, ${note.style.top}), width: ${note_rect.width}, height: ${note_rect.height}`);
}

const new_note_button = document.getElementById('new-note');
new_note_button.addEventListener('click', event => {
    // console.log(`${event.target} clicked.`);
    for (const note of notes) {
        note.style.opacity = 0.2;
    }
    const template = document.getElementById('note-box-form');
    const div = document.createElement('div');
    div.appendChild(template.content.cloneNode(true));
    div.classList.add('form-wrapper');
    document.body.appendChild(div);
    const form = div.querySelector('form');
    const cancel_button = div.querySelector('#cancel');
    const create_button = div.querySelector('#create-note');
    [create_button, cancel_button].forEach(button => {
        button.addEventListener('click', event => {
            // console.log(event.target.id);
            switch(event.target.id) {
                case 'cancel':
                    div.remove();
                    break;
                case 'create-note':
                        const data = new FormData(form);
                        const title = data.get('title');
                        const items = Array(6).fill(1).map((el, i) => data.get(`item_${i + 1}`)).filter(x => x);
                        div.remove();
                        console.log(title, items);
                        const note = new NoteBox(title, items);
                        notes.push(note);
                        note.style.backgroundColor = colours[rand_int(colour_count)];
                        workspace.appendChild(note);
                        const workspace_rect = note.parentElement.getBoundingClientRect();
                        const note_rect = note.getBoundingClientRect();
                        const left = workspace_rect.left + 0.5 * (workspace_rect.width - note_rect.width);
                        const top = workspace_rect.top + 0.5 * (workspace_rect.height - note_rect.height); 
                        note.style.left = `${left}px`;
                        note.style.top = `${top}px`;
                        note.style.zIndex = ++NoteBox.z_index;
                        for (const note of notes) {
                            note.style.opacity = 1.0;
                        }
                        break;
                default:
                    console.log(`Something else clicked - event targeted was ${event.target}.`);
            }
        });
    });
});
