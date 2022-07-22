// widget copypaste
define(['jquery', 'underscore', 'twigjs', 'lib/components/base/modal'], function ($, _, Twig, Modal) {
    var CustomWidget = function () {
        var self = this,
            system = self.system(),
            langs = self.langs;

        // функция добавления ссылки копирования сделки
        this.addLinkToCopy = function () {
            // если в карточке в сделке
            if (AMOCRM.isCard() === true && AMOCRM.getBaseEntity() === 'leads') {
                // если ссылки нет, добавляем
                if (!$('div.card-fields__top-name-more ul .element__copy-leads').length) {
                    $('div.card-fields__top-name-more ul').append(`
                        <li class="button-input__context-menu__item  element__copy-leads">
                            <div class="button-input__context-menu__item__inner">
                                <span class="button-input__context-menu__item__icon-container">
                                    <svg class="button-input__context-menu__item__icon svg-icon svg-common--copy-dims">
                                        <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#common--copy"></use>
                                    </svg>
                                </span>
                                <span class="button-input__context-menu__item__text">Копировать сделку</span>
                            </div>
                        </li>                    
                    `);
                }

                // массив с данными для создания копии сделки
                var leads = {},
                    leadID = AMOCRM.data.current_card.id;

                // нажатие на кнопку Копировать
                function sendCopyData() {
                    var isError = false;

                    // возвращаем естесственные цвета при клике на элементы
                    $('.pipeline-select-wrapper__inner__container').unbind('click');
                    $('.pipeline-select-wrapper__inner__container').bind('click', function () {
                        $('.pipeline-select').css('border-color', 'rgba(146,152,155,.4)');
                    });

                    $('.modal__select__wrapper .control--select--button').unbind('click');
                    $('.modal__select__wrapper .control--select--button').bind('click', function () {
                        $('.modal__select__wrapper .control--select--button').css('border-color', '#d4d5d8');
                    });

                    $('.modal__fields__wrapper .checkboxes_dropdown__title_wrapper').unbind('click');
                    $('.modal__fields__wrapper .checkboxes_dropdown__title_wrapper').bind('click', function () {
                        $('.modal__fields__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#dadadb');
                    });

                    $('.modal__history__wrapper .checkboxes_dropdown__title_wrapper').unbind('click');
                    $('.modal__history__wrapper .checkboxes_dropdown__title_wrapper').bind('click', function () {
                        $('.modal__history__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#dadadb');
                    });

                    $('.modal__contacts__wrapper .checkboxes_dropdown__title_wrapper').unbind('click');
                    $('.modal__contacts__wrapper .checkboxes_dropdown__title_wrapper').bind('click', function () {
                        $('.modal__contacts__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#dadadb');
                    });

                    $('.main__contact').unbind('click');
                    $('.main__contact').bind('click', function () {
                        $('.modal__contacts__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#dadadb');
                        $('.main__contact .checkboxes_dropdown__label_title').css('color', '#2e3640');
                    });

                    $('.modal__contacts__wrapper .js-master-checkbox-wrapper').unbind('click');
                    $('.modal__contacts__wrapper .js-master-checkbox-wrapper').bind('click', function () {
                        $('.modal__contacts__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#dadadb');
                        $('.main__contact .checkboxes_dropdown__label_title').css('color', '#2e3640');
                    });

                    // добавляем параметр radio
                    var radioLabel = $('.modal__radio__wrapper .control-radio');
                    $.each(radioLabel, function () {
                        if ($(this).hasClass('icon-radio-checked')) {
                            leads.radio = $(this).find('input[name="modal-radio-leads"]').val();
                        }
                    });

                    // добавляем параметр pipelines
                    var pipelinesSelect = $('.modal__pipelines__wrapper .pipeline-select'),
                        pipelinesLabels = [];

                    $.each(pipelinesSelect, function () {
                        $.each($(this).find('li label'), function () {
                            if (!$(this).hasClass('is-checked')) return;
                            var status_ID = $(this).find('input').attr('id');

                            if (!pipelinesLabels.includes(status_ID)) pipelinesLabels.push(status_ID);
                        });
                    });

                    if (pipelinesLabels.length == 0) {
                        $('.pipeline-select').css('border-color', '#f57d7d');
                        isError = true;
                    } else leads.pipelines = pipelinesLabels;

                    // добавляем параметр user
                    var selectUser = $('.modal__select__wrapper .control--select--button').text();
                    if (selectUser == 'Выберите ответственного для сделок') {
                        $('.modal__select__wrapper .control--select--button').css('border-color', '#f57d7d');
                        isError = true;
                    } else leads.user = selectUser.replace('Для: ', '');

                    // добавляем параметр fields
                    var fieldsItems = $('.modal__fields__wrapper .checkboxes_dropdown__item'),
                        fieldsLabels = [];

                    $.each(fieldsItems, function () {
                        $.each($(this).find('label'), function () {
                            if (!$(this).hasClass('is-checked')) return;
                            if ($(this).hasClass('js-master-checkbox-wrapper')) return;

                            var field_ID = $(this).find('input').val(),
                                field_title = $(this).find('.checkboxes_dropdown__label_title').attr('title'),
                                field = { field_ID, field_title };

                            if (!fieldsLabels.includes(field)) fieldsLabels.push(field);
                        });
                    });

                    if (fieldsLabels.length == 0) {
                        $('.modal__fields__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#f57d7d');
                        isError = true;
                    } else leads.fields = fieldsLabels;

                    // добавляем параметр history
                    var historyItems = $('.modal__history__wrapper .checkboxes_dropdown__item'),
                        historyLabels = [];

                    $.each(historyItems, function () {
                        $.each($(this).find('label'), function () {
                            if (!$(this).hasClass('is-checked')) return;
                            if ($(this).hasClass('js-master-checkbox-wrapper')) return;

                            var field_title = $(this).find('.checkboxes_dropdown__label_title').attr('title');
                            if (!historyLabels.includes(field_title)) historyLabels.push(field_title);
                        });
                    });

                    if (historyLabels.length == 0) {
                        $('.modal__history__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#f57d7d');
                        isError = true;
                    } else leads.history = historyLabels;

                    // добавляем параметр tags
                    var tagsLabel = $('.modal__radiotags__wrapper .control-radio');
                    $.each(tagsLabel, function () {
                        if ($(this).hasClass('icon-radio-checked')) {
                            leads.tags = $(this).find('input[name="modal-radiotags-leads"]').val();
                        }
                    });

                    // добавляем параметр company
                    var companyLabel = $('.modal__company__wrapper label'),
                        company_ID = $('.modal__company__wrapper input').attr('id');

                    if (companyLabel.hasClass('is-checked')) leads.company = company_ID;
                    else leads.company = null;

                    // добавляем параметр contacts
                    var contactsItems = $('.modal__contacts__wrapper .checkboxes_dropdown__item'),
                        contactsLabels = [];

                    $.each(contactsItems, function () {
                        $.each($(this).find('label'), function () {
                            if (!$(this).hasClass('is-checked')) return;
                            if ($(this).hasClass('js-master-checkbox-wrapper')) return;

                            var contact_ID = $(this).find('input').val(),
                                contact_title = $(this).find('.checkboxes_dropdown__label_title').attr('title'),
                                contact = { contact_ID, contact_title };

                            if (!contactsLabels.includes(contact)) contactsLabels.push(contact);
                        });
                    });

                    var mainContact = $('.main__contact');
                    var mainContactTitle = $('.main__contact .checkboxes_dropdown__label_title');

                    if (contactsLabels.length == 0 || !mainContact.hasClass('is-checked')) {
                        $('.modal__contacts__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#f57d7d');
                        mainContactTitle.css('color', '#f57d7d');
                        isError = true;
                    } else leads.contacts = contactsLabels;

                    // добавляем параметр products
                    var productsLabel = $('.modal__radioproducts__wrapper .control-radio');
                    $.each(productsLabel, function () {
                        if ($(this).hasClass('icon-radio-checked')) {
                            leads.products = $(this).find('input[name="modal-radioproducts-leads"]').val();
                        }
                    });

                    // если ошибки есть, останавливаем кнопку
                    if (isError) return false;
                    console.log(leads);
                    $('.modal-copypaste').remove();
                }

                /* ####################################################################### */

                var copyLink = $('div.card-fields__top-name-more ul .element__copy-leads');
                copyLink.unbind('click');
                copyLink.bind('click', function () {

                    new Modal({
                        class_name: 'modal-copypaste',
                        init: function ($modal_body) {
                            var $this = $(this);
                            $modal_body
                                .trigger('modal:loaded')
                                .html(`
                                    <div class="modal__main-block" style="width: 100%; min-height: 675px;">
                                        <h2 class="modal-body__caption head_2">Копировать сделку</h2>
                                    </div>
                                `)
                                .trigger('modal:centrify')
                                .append('');
                        },
                        destroy: function () {}
                    });

                    // radio button - какие сделки копировать
                    var radioAll = Twig({ ref: '/tmpl/controls/radio.twig' }).render({
                            prefix: 'allLeads',
                            class_name: 'modal__radio-leads',
                            label: 'всех сделок',
                            name: 'modal-radio-leads',
                            value: 'allLeads',
                            selected: true
                        }),
                        radioSelect = Twig({ ref: '/tmpl/controls/radio.twig' }).render({
                            prefix: 'selectLeads',
                            class_name: 'modal__radio-leads',
                            label: 'только тех сделок, которые находятся на текущей странице',
                            name: 'modal-radio-leads',
                            value: 'selectLeads'
                        }),
                        radioWrapper = `<div class="modal__radio__wrapper" style="width: 100%;">
                            <span style="width: 100%; margin-bottom: 10px;">Применить действие для:</span>
                        </div>`;

                    $('.modal__main-block').append(radioWrapper);
                    $('.modal__radio__wrapper').append(radioAll);
                    $('.modal__radio__wrapper').append(radioSelect);
                    $('.modal__radio__wrapper .control-radio').first().addClass('icon-radio-checked');

                    // воронки и статусы
                    $.ajax({
                        url: '/api/v4/leads/pipelines',
                        success: function (data) {
                            var pipelines = [];

                            $.each(data._embedded.pipelines, function () {
                                var pipeline_ID = this.id,
                                    pipeline_name = this.name;

                                // добавляем воронки
                                pipelines.push({ id: pipeline_ID, name: pipeline_name, statuses: [] });

                                $.each(this._embedded.statuses, function () {
                                    if (this.type == 1) return;

                                    var status_ID = this.id,
                                        status_name = this.name,
                                        status_color = this.color;

                                    // добавляем к воронкам статусы
                                    $.each(pipelines, function () {
                                        if (this.id !== pipeline_ID) return;
                                        this.statuses.push({
                                            id: status_ID,
                                            name: status_name,
                                            color: status_color
                                        });
                                    });
                                });
                            });

                            // pipelines select
                            var pipelines = Twig({ ref: '/tmpl/controls/pipeline_select/index.twig' }).render({
                                    has_pipelines: true,
                                    items: pipelines,
                                    multiple: true,
                                    class_name: 'modal__pipelines-leads',
                                    id: 'pipelinesLeads'
                                }),
                                pipelinesWrapper = `<div class="modal__pipelines__wrapper" style="width: 100%; margin-top: 20px;">
                                    <span style="width: 100%;">Воронки, этапы:</span>
                                </div>`;

                            $('.modal__radio__wrapper').after(pipelinesWrapper);
                            $('.modal__pipelines__wrapper').append(pipelines);
                            $('.modal__pipelines-leads').css('margin-top', '3px');
                        },
                        timeout: 2000
                    });

                    // ответственный в сделках
                    var managers = [];
                    managers.push({
                        id: 'null',
                        option: 'Выберите ответственного для сделок'
                    });

                    $.each(AMOCRM.constant('managers'), function () {
                        managers.push({
                            id: this.id,
                            option: this.title
                        });
                    });

                    var select = Twig({ ref: '/tmpl/controls/select.twig' }).render({
                            items: managers,
                            class_name: 'modal__select-leads'
                        }),
                        selectWrapper = '<div class="modal__select__wrapper" style="width: 100%; margin-top: 20px;"></div>';

                    $('.modal__main-block').append(selectWrapper);
                    $('.modal__select__wrapper').append(select);
                    $('.modal__select-leads .control--select--button').css('width', '100%');
                    $('.modal__select-leads ul').css({
                        'margin-left': '13px',
                        'width': 'auto',
                        'min-width': $('.modal__main-block').outerWidth() - 13
                    });

                    // приставка Для на кнопку select'a
                    $('.modal__select-leads ul li').unbind('click');
                    $('.modal__select-leads ul li').bind('click', function (e) {
                        var selectButton = $('.modal__select-leads .control--select--button');

                        if ($(e.target).text() == 'Выберите ответственного для сделок') selectButton.text($(e.target).text());
                        else selectButton.text('Для: ' + $(e.target).text());
                    });

                    // поля
                    $.ajax({
                        url: '/api/v4/leads/custom_fields',
                        success: function (data) {
                            var fieldsItems = [];

                            $.each(data._embedded.custom_fields, function () {
                                fieldsItems.push({
                                    class_name: 'modal__fields__leads-item',
                                    id: this.id,
                                    prefix: this.id,
                                    option: this.name
                                });
                            });

                            fieldsItems.reverse();

                            var fields = Twig({ ref: '/tmpl/controls/checkboxes_dropdown/index.twig' }).render({
                                    class_name: 'modal__fields-leads',
                                    items: fieldsItems
                                }),
                                fieldsWrapper = `<div class="modal__fields__wrapper" style="width: 100%;">
                                    <span style="width: 100%;">Выберите поля для переноса в новую сделку:</span>
                                </div>`;

                            $('.modal__select__wrapper').after(fieldsWrapper);
                            $('.modal__fields__wrapper').append(fields);
                            $('.modal__fields__wrapper').css('margin-top', '20px');
                            $('.modal__fields-leads').css('margin-top', '3px');
                        },
                        timeout: 2000
                    });

                    // история сделки
                    var historyItems = [
                        { class_name: 'modal__fields__leads-item', id: 'null', prefix: 'null', option: 'чаты внутренние' },
                        { class_name: 'modal__fields__leads-item', id: 'null', prefix: 'null', option: 'чаты внешние' },
                        { class_name: 'modal__fields__leads-item', id: 'null', prefix: 'null', option: 'примечания' },
                        { class_name: 'modal__fields__leads-item', id: 'null', prefix: 'null', option: 'задачи завершённые' },
                        { class_name: 'modal__fields__leads-item', id: 'null', prefix: 'null', option: 'задачи незавершённые' },
                        { class_name: 'modal__fields__leads-item', id: 'null', prefix: 'null', option: 'файлы' },
                        { class_name: 'modal__fields__leads-item', id: 'null', prefix: 'null', option: 'записи разговоров' },
                        { class_name: 'modal__fields__leads-item', id: 'null', prefix: 'null', option: 'объединённые сущности' }
                    ];

                    var history = Twig({ ref: '/tmpl/controls/checkboxes_dropdown/index.twig' }).render({
                            class_name: 'modal__history-leads',
                            items: historyItems
                        }),
                        historyWrapper = `<div class="modal__history__wrapper" style="width: 100%;">
                            <span style="width: 100%;">Выберите историю для переноса в новую сделку:</span>
                        </div>`;

                    $('.modal__main-block').append(historyWrapper);
                    $('.modal__history__wrapper').append(history);
                    $('.modal__history__wrapper').css('margin-top', '20px');
                    $('.modal__history-leads').css('margin-top', '3px');

                    // тэги
                    var radioAllTags = Twig({ ref: '/tmpl/controls/radio.twig' }).render({
                            prefix: 'allTagsLeads',
                            class_name: 'modal__radiotags-leads',
                            label: 'копировать все теги',
                            name: 'modal-radiotags-leads',
                            value: 'allTagsLeads',
                            selected: true
                        }),
                        radioNotTags = Twig({ ref: '/tmpl/controls/radio.twig' }).render({
                            prefix: 'notTagsLeads',
                            class_name: 'modal__radiotags-leads',
                            label: 'не копировать тэги',
                            name: 'modal-radiotags-leads',
                            value: 'notTagsLeads'
                        }),
                        radioTagsWrapper = `<div class="modal__radiotags__wrapper" style="width: 100%; margin-top: 20px;">
                            <span style="width: 100%; margin-bottom: 10px;">Тэги:</span>
                        </div>`;

                    $('.modal__main-block').append(radioTagsWrapper);
                    $('.modal__radiotags__wrapper').append(radioAllTags);
                    $('.modal__radiotags__wrapper').append(radioNotTags);
                    $('.modal__radiotags-leads').css('margin-top', '3px');
                    $('.modal__radiotags__wrapper .control-radio').first().addClass('icon-radio-checked');

                    // компания
                    var company_ID = AMOCRM.data.current_card.id;
                    $.ajax({
                        // _embedded[companies]
                        url: `/api/v4/leads/${ leadID }`,
                        success: function (data) {
                            company_ID = data._embedded.companies[0].id;

                            var company = Twig({ ref: '/tmpl/controls/checkbox.twig' }).render({
                                    class_name: 'modal__company-leads',
                                    id: company_ID,
                                    checked: true,
                                    value: 'Копировать компанию',
                                    input_class_name: 'modal__company__leads-item',
                                    name: 'modal-company-leads',
                                    text: 'Копировать компанию'
                                }),
                                companyWrapper = '<div class="modal__company__wrapper" style="width: 100%; margin-top: 20px;"></div>';

                            $('.modal__radiotags__wrapper').after(companyWrapper);
                            $('.modal__company__wrapper').append(company);
                        },
                        timeout: 2000
                    });

                    // контакты
                    var contactsWrapper = `<div class="modal__contacts__wrapper" style="width: 100%;">
                        <span style="width: 100%;">Выберите контакты для переноса в новую сделку:</span>
                    </div>`;
                    $('.modal__main-block').append(contactsWrapper);
                    $('.modal__contacts__wrapper').css('margin-top', '20px');

                    var contactsItems = [],
                        isMainContact = null;

                    // определяем основной контакт
                    $.ajax({
                        url: `/api/v4/leads/${ leadID }`,
                        data: 'with=contacts',
                        success: function (data) {
                            $.each(data._embedded.contacts, function () {
                                if (this.is_main === true) isMainContact = this.id;
                            });

                            // вывод контактов
                            $.ajax({
                                url: '/api/v4/contacts',
                                data: 'with=leads',
                                success: function (data) {
                                    $.each(data._embedded.contacts, function () {
                                        if (!this._embedded.leads || this._embedded.leads.length == 0) return;

                                        var contact_name = this.name,
                                            contact_ID = this.id;

                                        $.each(this._embedded.leads, function () {
                                            if (leadID != this.id) return;

                                            contactsItems.push({
                                                class_name: 'modal__contacts__leads-item',
                                                id: contact_ID,
                                                prefix: contact_ID,
                                                option: contact_name,
                                                // если основной контакт есть, по умолчанию ставим галочку и добавляем аттрибут
                                                is_checked: isMainContact == contact_ID ? true : false
                                            });
                                        });
                                    });

                                    var contacts = Twig({ ref: '/tmpl/controls/checkboxes_dropdown/index.twig' }).render({
                                        class_name: 'modal__contacts-leads',
                                        items: contactsItems
                                    });

                                    $('.modal__contacts__wrapper').append(contacts);
                                    $('.modal__contacts-leads').css('margin-top', '3px');

                                    // если контакт основной, добавляем класс для проверки
                                    $.each($('.modal__contacts__wrapper .checkboxes_dropdown__item'), function () {
                                        if ($(this).find('input').val() == isMainContact) $(this).find('label').addClass('main__contact');
                                    });
                                },
                                timeout: 2000
                            });
                        },
                        timeout: 2000
                    });

                    // товары
                    var radioAllProducts = Twig({ ref: '/tmpl/controls/radio.twig' }).render({
                            prefix: 'allProductsLeads',
                            class_name: 'modal__radioproducts-leads',
                            label: 'копировать все товары',
                            name: 'modal-radioproducts-leads',
                            value: 'allProductsLeads',
                            selected: true
                        }),
                        radioNotProducts = Twig({ ref: '/tmpl/controls/radio.twig' }).render({
                            prefix: 'notProductsLeads',
                            class_name: 'modal__radioproducts-leads',
                            label: 'не копировать товары',
                            name: 'modal-radioproducts-leads',
                            value: 'notProductsLeads'
                        }),
                        radioProductsWrapper = `<div class="modal__radioproducts__wrapper" style="width: 100%; margin-top: 20px;">
                            <span style="width: 100%; margin-bottom: 10px;">Товары:</span>
                        </div>`;

                    $('.modal__main-block').append(radioProductsWrapper);
                    $('.modal__radioproducts__wrapper').append(radioAllProducts);
                    $('.modal__radioproducts__wrapper').append(radioNotProducts);
                    $('.modal__radioproducts-leads').css('margin-top', '3px');
                    $('.modal__radioproducts__wrapper .control-radio').first().addClass('icon-radio-checked');

                    // кнопки Сохранить и Отменить
                    var saveBtn = Twig({ ref: '/tmpl/controls/button.twig' }).render({
                            class_name: 'modal__saveBtn-leads',
                            text: 'Копировать'
                        }),
                        cancelBtn = Twig({ ref: '/tmpl/controls/cancel_button.twig' }).render({
                            class_name: 'modal__cancelBtn-leads',
                            text: 'Отменить'
                        }),
                        btnWrapper = '<div class="modal-body__actions" style="width: 100%; text-align: right;"></div>';

                    $('.modal__radioproducts__wrapper').after(btnWrapper);
                    $('.modal-body__actions').append(saveBtn);
                    $('.modal-body__actions').append(cancelBtn);
                    $('.modal-body__actions').css('margin-top', '20px');

                    // чтобы модальное окно не прижималось книзу (не смог исправить стандартный вариант)
                    $('.modal__main-block').append(`
                        <div class="modal__bottom" style="position: absolute; height: 70px; width: 100%"></div>
                    `);

                    // нажатие на кнопку Копировать
                    $('.modal__saveBtn-leads').unbind('click');
                    $('.modal__saveBtn-leads').bind('click', sendCopyData);
                });
            }
        }

        this.callbacks = {
            settings: function () {},
            init: function () {
                return true;
            },
            bind_actions: function () {
                return true;
            },
            render: function () {
                self.addLinkToCopy();
                return true;
            },
            dpSettings: function () {},
            advancedSettings: function () {},
            destroy: function () {},
            contacts: {
                selected: function () {}
            },
            onSalesbotDesignerSave: function (handler_code, params) {},
            leads: {
                selected: function () {}
            },
            todo: {
                selected: function () {},
            },
            onSave: function () {
                return true;
            },
            onAddAsSource: function (pipeline_id) {}
        };
        return this;
    };
    return CustomWidget;
});
