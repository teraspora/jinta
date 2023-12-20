function makeElementDraggable(elementId) {
    const draggableElement = document.getElementById(elementId);

    let offsetX, offsetY, isDragging = false;

    draggableElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - draggableElement.getBoundingClientRect().left;
        offsetY = e.clientY - draggableElement.getBoundingClientRect().top;
        draggableElement.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;

        draggableElement.style.left = `${x}px`;
        draggableElement.style.top = `${y}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        draggableElement.style.cursor = 'grab';
    });
}

// Make elements with different IDs draggable
makeElementDraggable('draggable1');
makeElementDraggable('draggable2');