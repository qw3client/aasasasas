let parents = [];

axios.get('api/faq').then(data => {
    if (data.data == null) return;

    parseFaqData(data.data);

    window.semantic = {
        handler: {}
    };

    semantic.accordion = {};

    semantic.accordion.ready = function () {
        var $accordion = $('.ui.accordion'), $menuAccordion = $('.ui.menu.accordion'), handler;

        $accordion.accordion({
            exclusive: false
        });
        $menuAccordion.accordion({
            exclusive: false
        });

        $accordion.each(function () {
            for (let i = 0; i < parents.length; i++) {
                $(this).accordion('open', parents[i]);
            }
        });
    };

    $(document).ready(semantic.accordion.ready);
});

const parseFaqData = data => {
    let i = 0;

    data.data.forEach(index => {
        let titleDiv = document.createElement('div'),
            dropdownIcon = document.createElement('i'),
            nameSpan = document.createElement('span'),
            contentDiv = document.createElement('div');

        dropdownIcon.className = 'dropdown icon';

        nameSpan.innerText = index.name;

        titleDiv.className = 'title';
        titleDiv.appendChild(dropdownIcon);
        titleDiv.appendChild(nameSpan);

        contentDiv.className = 'content';

        let accordionElement;

        if (index.subcategories.length > 0) {
            accordionElement = document.createElement('div');
            accordionElement.className = 'accordion';
        }

        index.subcategories.forEach(subcategory => {

            let subcategoryTitleDiv = document.createElement('div'),
                subcategoryAnswerDiv = document.createElement('div'),
                subcategoryDropdownIcon = document.createElement('i'),
                subcategoryNameSpan = document.createElement('span');

            subcategoryNameSpan.innerText = subcategory.name;

            subcategoryDropdownIcon.className = 'dropdown icon';

            subcategoryTitleDiv.className = 'title';
            subcategoryTitleDiv.appendChild(subcategoryDropdownIcon);
            subcategoryTitleDiv.appendChild(subcategoryNameSpan);

            subcategoryAnswerDiv.className = 'content';
            subcategoryAnswerDiv.innerHTML = subcategory.answer;

            accordionElement.appendChild(subcategoryTitleDiv);
            accordionElement.appendChild(subcategoryAnswerDiv);
        });

        if (index.subcategories.length > 0) {
            contentDiv.appendChild(accordionElement);
        }

        document.getElementById('accordion').appendChild(titleDiv);
        document.getElementById('accordion').appendChild(contentDiv);

        parents.push(i);
        i = i + index.subcategories.length + 1;
    });
}
