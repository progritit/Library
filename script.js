"use strict";

/* ============================================================
   SOLARIS ARCHIVE
   ------------------------------------------------------------
   The data inside myLibrary is the application's source of truth.

   The HTML cards do not store the real book data. They only
   display what currently exists inside myLibrary.
   ============================================================ */


/* ============================================================
   DOM REFERENCES
   ------------------------------------------------------------
   These constants connect JavaScript to the relevant HTML
   elements.

   Keeping them together makes them easier to find and update.
   ============================================================ */

// Main library container
const recordsGrid = document.querySelector("#records-grid");

// Dialog controls
const entryDialog = document.querySelector("#entry-dialog");
const openDialogButton = document.querySelector(
    "#open-entry-dialog"
);
const closeDialogButton = document.querySelector(
    "#close-entry-dialog"
);
const cancelEntryButton = document.querySelector("#cancel-entry");

// New record form
const entryForm = document.querySelector("#entry-form");

// Search and filter controls
const searchInput = document.querySelector("#record-search");
const categoryFilter = document.querySelector(
    "#category-filter"
);
const statusFilter = document.querySelector("#status-filter");
const classificationFilter = document.querySelector(
    "#classification-filter"
);

// Statistic values
const totalRecordsValue = document.querySelector(
    ".stat-card--total .stat-card__value"
);

const reviewedRecordsValue = document.querySelector(
    ".stat-card--reviewed .stat-card__value"
);

const pendingRecordsValue = document.querySelector(
    ".stat-card--pending .stat-card__value"
);

const restrictedRecordsValue = document.querySelector(
    ".stat-card--restricted .stat-card__value"
);

// Footer copyright
const copyrightText = document.querySelector(
    ".footer__copyright"
);


/* ============================================================
   ASSET PATH
   ------------------------------------------------------------
   Keeping the shared icon path in one constant avoids repeating
   the full folder path throughout the file.
   ============================================================ */

const ICON_PATH = "./assets/icons";
const ILLUSTRATION_PATH = "./assets/illustrations";


/* ============================================================
   LIBRARY DATA
   ------------------------------------------------------------
   Every Book object created by the application is stored here.

   The array is the real library. The cards on the page are only
   visual representations of these objects.
   ============================================================ */

const myLibrary = [];


/* ============================================================
   BOOK CONSTRUCTOR
   ------------------------------------------------------------
   The constructor acts as a blueprint for creating Book objects.

   Every Book receives:
   - a unique and stable UUID;
   - title;
   - author or source;
   - category;
   - page count;
   - priority;
   - classification;
   - review status.
   ============================================================ */

function Book(
    title,
    author,
    category,
    pages,
    priority,
    classification,
    isRead
) {
    // crypto.randomUUID() creates a unique identifier.
    this.id = crypto.randomUUID();

    // trim() removes accidental spaces from text inputs.
    this.title = title.trim();
    this.author = author.trim();
    this.category = category;
    this.pages = Number(pages);
    this.priority = priority;
    this.classification = classification;

    // Boolean() ensures that isRead is always true or false.
    this.isRead = Boolean(isRead);
}


/* ============================================================
   BOOK PROTOTYPE METHOD
   ------------------------------------------------------------
   This method is shared by all Book objects through the prototype.

   It changes:
   true  -> false
   false -> true
   ============================================================ */

Book.prototype.toggleRead = function () {
    this.isRead = !this.isRead;
};


/* ============================================================
   ADD A BOOK TO THE LIBRARY
   ------------------------------------------------------------
   This function is deliberately separate from the constructor.

   The constructor creates the object.
   This function stores the object in myLibrary.
   ============================================================ */

function addBookToLibrary(
    title,
    author,
    category,
    pages,
    priority,
    classification,
    isRead
) {
    const newBook = new Book(
        title,
        author,
        category,
        pages,
        priority,
        classification,
        isRead
    );

    myLibrary.push(newBook);

    return newBook;
}


/* ============================================================
   REMOVE A BOOK
   ------------------------------------------------------------
   The stable UUID allows us to find the correct object even if
   books have been removed or rearranged.

   splice() removes one object from the array.
   ============================================================ */

function removeBookFromLibrary(bookId) {
    const bookIndex = myLibrary.findIndex(
        (book) => book.id === bookId
    );

    // findIndex() returns -1 when no matching object is found.
    if (bookIndex === -1) {
        return;
    }

    myLibrary.splice(bookIndex, 1);

    renderLibrary();
}


/* ============================================================
   TOGGLE REVIEW STATUS
   ------------------------------------------------------------
   This finds the relevant Book object and calls the prototype
   method created earlier.
   ============================================================ */

function toggleBookReadStatus(bookId) {
    const selectedBook = myLibrary.find(
        (book) => book.id === bookId
    );

    if (!selectedBook) {
        return;
    }

    selectedBook.toggleRead();

    renderLibrary();
}


/* ============================================================
   GENERAL DOM HELPERS
   ------------------------------------------------------------
   These small helper functions reduce repeated DOM code.

   They still use normal createElement(), textContent, append(),
   and className, so nothing is hidden or automated magically.
   ============================================================ */

/**
 * Creates an HTML element and optionally gives it a class and text.
 *
 * @param {string} tagName - The HTML tag to create.
 * @param {string} className - CSS classes for the element.
 * @param {string} text - Text placed inside the element.
 * @returns {HTMLElement}
 */
function createElement(
    tagName,
    className = "",
    text = ""
) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text) {
        element.textContent = text;
    }

    return element;
}


/**
 * Creates an image for one of the project icons.
 *
 * Decorative icons receive an empty alt attribute because the
 * nearby visible text already describes their meaning.
 *
 * @param {string} filename - Name of the icon file.
 * @returns {HTMLImageElement}
 */
function createIcon(filename) {
    const icon = document.createElement("img");

    icon.src = `${ICON_PATH}/${filename}`;
    icon.alt = "";

    return icon;
}


/* ============================================================
   VALUE NORMALIZATION
   ------------------------------------------------------------
   The filter values use formats such as:

   "technical-manual"
   "level-2"

   Book objects contain display values such as:

   "Technical Manual"
   "Level 2"

   This function converts display text into the filter format.
   ============================================================ */

function normalizeValue(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}


/* ============================================================
   DISPLAY ID
   ------------------------------------------------------------
   The full UUID is used internally in data-record-id.

   A shorter version is displayed visually so the card does not
   need to show a very long identifier.
   ============================================================ */

function createDisplayId(uuid) {
    return `ARC-${uuid.slice(0, 8).toUpperCase()}`;
}


/* ============================================================
   CLASS HELPERS
   ------------------------------------------------------------
   These functions choose the CSS class required by a particular
   record's data.
   ============================================================ */

function getClassificationClass(classification) {
    const normalizedClassification =
        normalizeValue(classification);

    if (normalizedClassification === "restricted") {
        return "classification--restricted";
    }

    if (normalizedClassification === "public") {
        return "classification--public";
    }

    return "classification--level";
}


function getCardModifierClass(classification) {
    const normalizedClassification =
        normalizeValue(classification);

    if (normalizedClassification === "restricted") {
        return "record-card--restricted";
    }

    if (normalizedClassification === "public") {
        return "record-card--public";
    }

    return "";
}


function getPriorityClass(priority) {
    return `priority--${normalizeValue(priority)}`;
}


/* ============================================================
   CREATE A METADATA ITEM
   ------------------------------------------------------------
   Used for:
   - page count;
   - priority.

   The review status item has a slightly different structure and
   is therefore created separately.
   ============================================================ */

function createMetadataItem(
    iconFilename,
    text,
    className = ""
) {
    const metadataItem = createElement("span", className);
    const icon = createIcon(iconFilename);

    metadataItem.append(icon, text);

    return metadataItem;
}


/* ============================================================
   CREATE ONE BOOK CARD
   ------------------------------------------------------------
   This function receives one Book object and returns one complete
   article element.

   It does not modify myLibrary. Its only responsibility is
   creating the visual representation of one object.
   ============================================================ */

function createBookCard(book) {
    /* ----------------------------------------------------------
       Card container
       ---------------------------------------------------------- */

    const cardModifierClass = getCardModifierClass(
        book.classification
    );

    const card = createElement(
        "article",
        `record-card ${cardModifierClass}`.trim()
    );

    /*
      The complete UUID connects this DOM card to its Book object.
    */
    card.dataset.recordId = book.id;


    /* ----------------------------------------------------------
       Card header
       ---------------------------------------------------------- */

    const cardHeader = createElement(
        "header",
        "record-card__header"
    );

    const categoryContainer = createElement(
        "div",
        "record-card__category"
    );

    const documentIcon = createIcon("file-text.png");
    documentIcon.className = "record-card__document-icon";

    const categoryText = createElement(
        "span",
        "",
        book.category
    );

    categoryContainer.append(documentIcon, categoryText);

    const classification = createElement(
        "span",
        `classification ${getClassificationClass(
            book.classification
        )}`,
        book.classification
    );

    cardHeader.append(categoryContainer, classification);


    /* ----------------------------------------------------------
       Title and author/source
       ---------------------------------------------------------- */

    const cardContent = createElement(
        "div",
        "record-card__content"
    );

    const title = createElement("h3", "", book.title);

    const author = createElement(
        "p",
        "record-card__source",
        book.author
    );

    cardContent.append(title, author);


    /* ----------------------------------------------------------
       Metadata row
       ---------------------------------------------------------- */

    const metadataContainer = createElement(
        "div",
        "record-card__meta"
    );

    const pagesMetadata = createMetadataItem(
        "book-open.png",
        `${book.pages} Pages`
    );

    const priorityMetadata = createMetadataItem(
        "flag.png",
        book.priority,
        `priority ${getPriorityClass(book.priority)}`
    );

    const statusClass = book.isRead
        ? "record-status--reviewed"
        : "record-status--pending";

    const statusText = book.isRead
        ? "Reviewed"
        : "Pending Review";

    const statusMetadata = createElement(
        "span",
        `record-status ${statusClass}`
    );

    const statusDot = createElement("span", "status-dot");

    statusMetadata.append(statusDot, statusText);

    metadataContainer.append(
        pagesMetadata,
        priorityMetadata,
        statusMetadata
    );


    /* ----------------------------------------------------------
       Action buttons
       ---------------------------------------------------------- */

    const actionsContainer = createElement(
        "div",
        "record-card__actions"
    );

    const statusButton = createElement(
        "button",
        book.isRead
            ? "status-button status-button--reviewed"
            : "status-button status-button--pending"
    );

    statusButton.type = "button";

    /*
      aria-pressed communicates the current toggle state to
      assistive technologies.
    */
    statusButton.setAttribute(
        "aria-pressed",
        String(book.isRead)
    );

    statusButton.setAttribute(
        "aria-label",
        `Change review status for ${book.title}`
    );

    const statusButtonIcon = createIcon(
        book.isRead ? "check.png" : "clock.png"
    );

    statusButton.append(statusButtonIcon, statusText);

    statusButton.addEventListener("click", () => {
        toggleBookReadStatus(book.id);
    });


    const removeButton = createElement(
        "button",
        "remove-button"
    );

    removeButton.type = "button";

    removeButton.setAttribute(
        "aria-label",
        `Remove ${book.title}`
    );

    const removeIcon = createIcon("trash-2.png");

    removeButton.append(removeIcon, "Remove");

    removeButton.addEventListener("click", () => {
        removeBookFromLibrary(book.id);
    });

    actionsContainer.append(statusButton, removeButton);


    /* ----------------------------------------------------------
       Short visual identifier
       ---------------------------------------------------------- */

    const displayId = createElement(
        "p",
        "record-card__id",
        `ID: ${createDisplayId(book.id)}`
    );


    /* ----------------------------------------------------------
       Assemble and return the completed card
       ---------------------------------------------------------- */

    card.append(
        cardHeader,
        cardContent,
        metadataContainer,
        actionsContainer,
        displayId
    );

    return card;
}


/* ============================================================
   SEARCH AND FILTER LOGIC
   ------------------------------------------------------------
   This does not modify myLibrary.

   It creates a filtered array containing only the records that
   should currently be displayed.
   ============================================================ */

function getVisibleBooks() {
    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    const selectedCategory = categoryFilter.value;
    const selectedStatus = statusFilter.value;
    const selectedClassification =
        classificationFilter.value;

    return myLibrary.filter((book) => {
        /*
          Search through several Book properties rather than only
          the title.
        */
        const searchableText = [
            book.title,
            book.author,
            book.category,
            book.priority,
            book.classification,
        ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            searchableText.includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            normalizeValue(book.category) === selectedCategory;

        const bookStatus = book.isRead
            ? "reviewed"
            : "pending";

        const matchesStatus =
            selectedStatus === "all" ||
            bookStatus === selectedStatus;

        const matchesClassification =
            selectedClassification === "all" ||
            normalizeValue(book.classification) ===
            selectedClassification;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus &&
            matchesClassification
        );
    });
}


/* ============================================================
   EMPTY STATE
   ------------------------------------------------------------
   This component appears when:
   - myLibrary is completely empty; or
   - the current search and filters produce no results.
   ============================================================ */

function createEmptyState() {
    const emptyState = createElement(
        "article",
        "empty-preview library-empty-state"
    );

    const label = createElement(
        "p",
        "empty-preview__label",
        "Archive Status"
    );

    const symbol = document.createElement("img");

    symbol.className = "empty-preview__symbol";
    symbol.src =
        `${ILLUSTRATION_PATH}/empty-archive-symbol.png`;
    symbol.alt = "";

    const libraryIsEmpty = myLibrary.length === 0;

    const heading = createElement(
        "h2",
        "",
        libraryIsEmpty
            ? "No records detected"
            : "No matching records"
    );

    const description = createElement(
        "p",
        "",
        libraryIsEmpty
            ? "Register a new entry to initialize the archive."
            : "Adjust the search or filters to locate another record."
    );

    emptyState.append(
        label,
        symbol,
        heading,
        description
    );

    return emptyState;
}


/* ============================================================
   STATISTICS
   ------------------------------------------------------------
   Statistics are calculated from the complete myLibrary array,
   not from the filtered records currently visible on screen.
   ============================================================ */

function updateStatistics() {
    const totalRecords = myLibrary.length;

    const reviewedRecords = myLibrary.filter(
        (book) => book.isRead
    ).length;

    const pendingRecords =
        totalRecords - reviewedRecords;

    const restrictedRecords = myLibrary.filter(
        (book) =>
            normalizeValue(book.classification) ===
            "restricted"
    ).length;

    totalRecordsValue.textContent =
        formatStatistic(totalRecords);

    reviewedRecordsValue.textContent =
        formatStatistic(reviewedRecords);

    pendingRecordsValue.textContent =
        formatStatistic(pendingRecords);

    restrictedRecordsValue.textContent =
        formatStatistic(restrictedRecords);
}


/*
  Turns 6 into "06" to match the telemetry appearance.
  Numbers with two or more digits remain unchanged.
*/
function formatStatistic(value) {
    return String(value).padStart(2, "0");
}


/* ============================================================
   RENDER THE LIBRARY
   ------------------------------------------------------------
   This is the central display function.

   Every time the data or filters change, it:

   1. Gets the books that should be visible.
   2. Clears the current card container.
   3. Creates new cards from the Book objects.
   4. Updates the statistics.

   replaceChildren() is used instead of innerHTML.
   ============================================================ */

function renderLibrary() {
    const visibleBooks = getVisibleBooks();

    // Remove all currently displayed cards.
    recordsGrid.replaceChildren();

    if (visibleBooks.length === 0) {
        recordsGrid.append(createEmptyState());
    } else {
        visibleBooks.forEach((book) => {
            const bookCard = createBookCard(book);

            recordsGrid.append(bookCard);
        });
    }

    updateStatistics();
}


/* ============================================================
   DIALOG CONTROLS
   ============================================================ */

function openEntryDialog() {
    /*
      showModal() opens the native dialog and activates its backdrop.
    */
    if (!entryDialog.open) {
        entryDialog.showModal();
    }
}


function closeEntryDialog() {
    if (entryDialog.open) {
        entryDialog.close();
    }
}


/*
  The form is reset whenever the dialog closes, including when
  the user closes it by pressing Escape.
*/
entryDialog.addEventListener("close", () => {
    entryForm.reset();
});


openDialogButton.addEventListener(
    "click",
    openEntryDialog
);

closeDialogButton.addEventListener(
    "click",
    closeEntryDialog
);

cancelEntryButton.addEventListener(
    "click",
    closeEntryDialog
);


/* ============================================================
   FORM SUBMISSION
   ------------------------------------------------------------
   A form normally attempts to send data to a server and reload
   the page.

   preventDefault() stops that normal browser behavior.
   ============================================================ */

entryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    /*
      FormData reads form controls by their name attributes.
    */
    const formData = new FormData(entryForm);

    const title = formData.get("record-title");
    const author = formData.get("record-author");
    const category = formData.get("record-category");
    const pages = formData.get("record-pages");
    const priority = formData.get("record-priority");
    const classification = formData.get(
        "record-classification"
    );

    /*
      An unchecked checkbox is absent from FormData.
      Boolean(null) becomes false.
      Boolean("on") becomes true.
    */
    const isRead = Boolean(
        formData.get("record-reviewed")
    );

    addBookToLibrary(
        title,
        author,
        category,
        pages,
        priority,
        classification,
        isRead
    );

    /*
      Clear search and filters so the newly added record will
      definitely be visible.
    */
    resetToolbar();

    entryForm.reset();
    closeEntryDialog();

    renderLibrary();
});


/* ============================================================
   SEARCH AND FILTER EVENTS
   ------------------------------------------------------------
   Search uses the input event because it should update while
   the user types.

   Select elements use the change event.
   ============================================================ */

searchInput.addEventListener("input", renderLibrary);

categoryFilter.addEventListener(
    "change",
    renderLibrary
);

statusFilter.addEventListener(
    "change",
    renderLibrary
);

classificationFilter.addEventListener(
    "change",
    renderLibrary
);


/* ============================================================
   RESET SEARCH AND FILTERS
   ============================================================ */

function resetToolbar() {
    searchInput.value = "";
    categoryFilter.value = "all";
    statusFilter.value = "all";
    classificationFilter.value = "all";
}


/* ============================================================
   INITIAL TEST DATA
   ------------------------------------------------------------
   These records make the interface useful immediately after a
   page reload.

   They are created through addBookToLibrary(), exactly like
   records submitted through the form.

   There is intentionally no localStorage or database. Reloading
   the page returns the library to these initial records.
   ============================================================ */

function addInitialBooks() {
    addBookToLibrary(
        "Aurelium Grid Protocols",
        "Solaris Engineering Division",
        "Technical Manual",
        284,
        "High",
        "Level 2",
        true
    );

    addBookToLibrary(
        "The Helios Incident",
        "Commander Elian Voss",
        "Mission Log",
        96,
        "Critical",
        "Restricted",
        false
    );

    addBookToLibrary(
        "Solaris Access Node Specifications",
        "Network Security Unit",
        "System File",
        142,
        "Medium",
        "Level 3",
        true
    );

    addBookToLibrary(
        "Orbital Colony Field Notes",
        "Dr. Mara Sol",
        "Research",
        217,
        "Low",
        "Public",
        false
    );

    addBookToLibrary(
        "Solar Sketch Visual Records",
        "Creative Intelligence Lab",
        "Media Archive",
        73,
        "Medium",
        "Level 1",
        true
    );

    addBookToLibrary(
        "Calc-Core Diagnostic Manual",
        "Solaris Systems",
        "Technical Manual",
        188,
        "High",
        "Level 2",
        true
    );
}


/* ============================================================
   DYNAMIC COPYRIGHT YEAR
   ============================================================ */

function updateCopyrightYear() {
    const currentYear = new Date().getFullYear();

    copyrightText.textContent =
        `© ${currentYear} Solaris Network. ` +
        "All rights reserved.";
}


/* ============================================================
   APPLICATION STARTUP
   ------------------------------------------------------------
   These instructions run once when script.js loads.

   Because the script uses defer, the HTML already exists by the
   time this section runs.
   ============================================================ */

// Let screen readers know when the displayed card list changes.
recordsGrid.setAttribute("aria-live", "polite");

addInitialBooks();
updateCopyrightYear();
renderLibrary();