// copypaste
define(['jquery', 'underscore', 'twigjs', 'lib/components/base/modal'], function($, _, Twig, Modal) {
    var CustomWidget_WidgetCopypasteLeads = function() {
        var self = this,
            system = self.system,
            url_link_t = "https://integratorgroup.k-on.ru/andreev/copypaste/templates.php",
            products = [],
            managers = [];

        // записываем отмеченных в настройках пользователей в массив managers
        const toArrayManagers = function () {
            var config_settings = self.get_settings().config_settings || [];
            if (typeof config_settings !== 'string') config_settings = JSON.stringify(config_settings);
            config_settings = JSON.parse(config_settings);
            self.managers = [];
            $.each(config_settings, function (key, val) { self.managers.push(val) });

            return self.managers;
        }

        // добавляем ссылку в списки
        const linkToLeadsTodo = function (mutationsList) {
            if (AMOCRM.getWidgetsArea() !== 'leads') return;
            if (AMOCRM.isCard()) return;

            // если пользователь не отмечен в настройках, ссылку не показываем
            self.managers = toArrayManagers();
            userID = AMOCRM.constant('user').id;
            if (!self.managers.includes(userID.toString())) return;

            // добавляем ссылку Копировать сделки
            $.each(mutationsList, function () {
                if (this.type !== 'childList') return;
                if (!$('#list_multiple_actions').length) return;

                var copyLink = `
                    <div class="tips-item js-tips-item js-tips-item-widgets linkCopyLeads" data-id="" data-forced="" data-value="" data-suggestion-type="">
                        <span class="tips-icon-container">
                            <svg class="button-input__context-menu__item__icon svg-icon svg-common--copy-dims" style="width: 15px; height: 15px; margin-right: 5px;">
                                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#common--copy"></use>
                            </svg>
                        </span>
                        Копировать сделки
                    </div>
                `;

                if ($('#list__body-right .linkCopyLeads').length) return;
                $('#list__body-right .tips__inner').append(copyLink);

                // запускаем модальное окно
                $('.linkCopyLeads').unbind('click');
                $('.linkCopyLeads').bind('click', function (e) {
                    e.stopPropagation();
                    modalCreate();
                });
            });
        }

        this.observerLinkToLeadsTodo = new MutationObserver(linkToLeadsTodo);

        // добавляем ссылку в карточку
        this.linkToLeadsCard = function () {
            if (!AMOCRM.isCard()) return;

            // если пользователь не отмечен в настройках, ссылку не показываем
            self.managers = toArrayManagers();
            userID = AMOCRM.constant('user').id;
            if (!self.managers.includes(userID.toString())) return;

            if ($('div.card-fields__top-name-more ul .element__copy-leads').length) return;
            $('div.card-fields__top-name-more ul').append(`
                <li class="button-input__context-menu__item  linkCopyLeads">
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

            // запускаем модальное окно
            $('.linkCopyLeads').unbind('click');
            $('.linkCopyLeads').bind('click', () => modalCreate());
        }

        /* ######################################################################### */

        // функция отрисовки модалки с элементами
        const modalCreate = function () {
            var leadID, leads = {};
            if (AMOCRM.isCard()) leadID = AMOCRM.data.current_card.id;

            new Modal({
                class_name: 'modal-copypaste',
                init: function ($modal_body) {
                    var $this = $(this);
                    $modal_body
                        .trigger('modal:loaded')
                        .html(`
                            <div class="modal__main-block" style="width: 100%; min-height: 550px;">
                                <h2 class="modal-body__caption head_2">Копировать сделку</h2>
                            </div>
                        `)
                        .trigger('modal:centrify')
                        .append('');
                },
                destroy: function () {}
            });

            if (!AMOCRM.isCard()) {
                // radio button - какие сделки копировать
                var radioAll = Twig({ref: '/tmpl/controls/radio.twig'}).render({
                        prefix: 'selectLeads',
                        class_name: 'modal__radio-leads',
                        label: 'выбранных сделок',
                        name: 'modal-radio-leads',
                        value: 'selectLeads',
                        selected: true
                    }),
                    radioSelect = Twig({ref: '/tmpl/controls/radio.twig'}).render({
                        prefix: 'allLeads',
                        class_name: 'modal__radio-leads',
                        label: 'всех сделок, которые находятся на текущей странице',
                        name: 'modal-radio-leads',
                        value: 'allLeads'
                    }),
                    radioWrapper = `<div class="modal__radio__wrapper" style="width: 100%;">
                            <span style="width: 100%; margin-bottom: 10px;">Применить действие для:</span>
                        </div>`;

                $('.modal__main-block').append(radioWrapper);
                $('.modal__radio__wrapper').append(radioAll);
                $('.modal__radio__wrapper').append(radioSelect);
                $('.modal__radio__wrapper .control-radio').first().addClass('icon-radio-checked');
            }

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

                    if (AMOCRM.isCard()) $('.modal-body__caption').after(pipelinesWrapper);
                    else $('.modal__radio__wrapper').after(pipelinesWrapper);
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
            var fieldsItems = [];

            const addFields = function (fieldsItems) {
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
            }

            const ajaxFields = function (url) {
                $.ajax({
                    url: url,
                    success: function (data) {
                        $.each(data._embedded.custom_fields, function () {
                            fieldsItems.push({
                                class_name: 'modal__fields__leads-item',
                                id: this.id,
                                prefix: this.id,
                                option: this.name
                            });
                        });

                        if (data._links.next) ajaxFields(data._links.next.href);
                        else addFields(fieldsItems);
                    },
                    timeout: 5000
                });
            }

            ajaxFields('/api/v4/leads/custom_fields?limit=50');

            // история сделки
            var historyItems = [
                // { class_name: 'modal__fields__leads-item', id: 'chatsIn', prefix: 'null', option: 'чаты внутренние' },
                // { class_name: 'modal__fields__leads-item', id: 'chatsOut', prefix: 'null', option: 'чаты внешние' },
                { class_name: 'modal__fields__leads-item', id: 'notes', prefix: 'null', option: 'примечания' },
                { class_name: 'modal__fields__leads-item', id: 'tasksFinish', prefix: 'null', option: 'задачи завершённые' },
                { class_name: 'modal__fields__leads-item', id: 'tasksNotFinish', prefix: 'null', option: 'задачи незавершённые' },
                // { class_name: 'modal__fields__leads-item', id: 'files', prefix: 'null', option: 'файлы' },
                // { class_name: 'modal__fields__leads-item', id: 'talks', prefix: 'null', option: 'записи разговоров' },
                // { class_name: 'modal__fields__leads-item', id: 'united', prefix: 'null', option: 'объединённые сущности' }
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
            var tags = Twig({ ref: '/tmpl/controls/checkbox.twig' }).render({
                    class_name: 'modal__tags-leads',
                    checked: true,
                    value: 'Копировать тэги',
                    input_class_name: 'modal__tags__leads-item',
                    name: 'modal-tags-leads',
                    text: 'Копировать тэги'
                }),
                tagsWrapper = '<div class="modal__tags__wrapper" style="width: 100%; margin-top: 20px;"></div>';

            $('.modal__main-block').append(tagsWrapper);
            $('.modal__tags__wrapper').append(tags);

            // компания
            var company = Twig({ ref: '/tmpl/controls/checkbox.twig' }).render({
                    class_name: 'modal__company-leads',
                    checked: true,
                    value: 'Копировать компанию',
                    input_class_name: 'modal__company__leads-item',
                    name: 'modal-company-leads',
                    text: 'Копировать компанию'
                }),
                companyWrapper = '<div class="modal__company__wrapper" style="width: 100%; margin-top: 20px;"></div>';

            $('.modal__tags__wrapper').after(companyWrapper);
            $('.modal__company__wrapper').append(company);

            // товары
            var products = Twig({ ref: '/tmpl/controls/checkbox.twig' }).render({
                    class_name: 'modal__products-leads',
                    checked: true,
                    value: 'Копировать товары',
                    input_class_name: 'modal__products__leads-item',
                    name: 'modal-products-leads',
                    text: 'Копировать товары'
                }),
                productsWrapper = '<div class="modal__products__wrapper" style="width: 100%; margin-top: 20px;"></div>';

            $('.modal__company__wrapper').after(productsWrapper);
            $('.modal__products__wrapper').append(products);

            // добавляем товары в self.products
            if (AMOCRM.isCard()) {
                $.ajax({
                    url: `/api/v4/leads/${ leadID }?with=catalog_elements`,
                    success: function (data) {
                        var products = [];
                        $.each(data._embedded.catalog_elements, function () {
                            products.push(this.id)
                        });
                        self.products = products;
                    },
                    timeout: 2000
                });
            } else self.products = 'all';

            // контакты
            if (AMOCRM.isCard()) {
                var contactsWrapper = `<div class="modal__contacts__wrapper" style="width: 100%;">
                    <span style="width: 100%;">Выберите контакты для переноса в новую сделку:</span>
                </div>`;
                $('.modal__products__wrapper').after(contactsWrapper);
                $('.modal__contacts__wrapper').css('margin-top', '20px');

                var contactsItems = [], isMainContact = null;
                // контакты нашей сделки
                $.ajax({
                    url: `/api/v4/leads/${ leadID }`,
                    data: 'with=contacts',
                    success: function (data) {
                        var contactsCount = data._embedded.contacts.length;

                        $.each(data._embedded.contacts, function () {
                            // определяем основной контакт
                            if (this.is_main === true) isMainContact = this.id;

                            // поиск контакта по ID
                            $.ajax({
                                url: `/api/v4/contacts/${ this.id }`,
                                success: function (data) {
                                    var contact_name = data.name, contact_ID = data.id;

                                    contactsItems.push({
                                        class_name: 'modal__contacts__leads-item',
                                        id: data.id,
                                        prefix: data.id,
                                        option: data.name,
                                        // если основной контакт есть, по умолчанию ставим галочку и добавляем аттрибут
                                        is_checked: isMainContact == data.id ? true : false
                                    });

                                    // счетчик контактов, после чего отображать данные в форме
                                    contactsCount--;
                                    if (contactsCount > 0) return;

                                    var contacts = Twig({ref: '/tmpl/controls/checkboxes_dropdown/index.twig'}).render({
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
                        });
                    },
                    timeout: 2000
                });
            }

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

            if (AMOCRM.isCard()) $('.modal__contacts__wrapper').after(btnWrapper);
            else $('.modal__products__wrapper').after(btnWrapper);
            $('.modal-body__actions').append(saveBtn);
            $('.modal-body__actions').append(cancelBtn);
            $('.modal-body__actions').css('margin-top', '20px');

            // чтобы модальное окно не прижималось книзу (не смог исправить стандартный вариант)
            $('.modal__main-block').append(`
                <div class="modal__bottom" style="position: absolute; height: 70px; width: 100%"></div>
            `);

            // нажатие на кнопку Копировать
            $('.modal__saveBtn-leads').unbind('click');
            $('.modal__saveBtn-leads').bind('click', { leads }, sendCopyData);
        }
        /* ######################################################################### */

        // функция нажатия кнопки копирования
        const sendCopyData = function (e) {
            var isError = false, leads = e.data.leads;

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

            if (AMOCRM.isCard()) {
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
            }

            // передаем ID сделки для карточки
            if (AMOCRM.isCard()) leads.id = [AMOCRM.data.current_card.id];
            // передаем ID сделок для списков
            else {
                var radioLabel = $('.modal__radio__wrapper .control-radio');
                $.each(radioLabel, function () {
                    if ($(this).hasClass('icon-radio-checked')) {
                        var input = $(this).find('input[name="modal-radio-leads"]').val(),
                            leadsIds = [];

                        if (!$('#list_table .js-pager-list-item__1').length) {
                            leads.id = [];
                            return;
                        }

                        if (input == 'selectLeads') $.each(self.list_selected().selected, function () { leadsIds.push(this.id) });
                        else $.each($('.js-pager-list-item__1'), function () { leadsIds.push($(this).attr('data-id')) });
                        leads.id = leadsIds;
                    }
                });
            }

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
            var selectUser = $('.modal__select__wrapper .control--select--button');
            if (selectUser.attr('data-value') == 'null') {
                selectUser.css('border-color', '#f57d7d');
                isError = true;
            } else leads.user = selectUser.attr('data-value');

            // добавляем параметр fields
            var fieldsItems = $('.modal__fields__wrapper .checkboxes_dropdown__item'),
                fields = [];

            $.each(fieldsItems, function () {
                $.each($(this).find('label'), function () {
                    if (!$(this).hasClass('is-checked')) return;
                    if ($(this).hasClass('js-master-checkbox-wrapper')) return;

                    var field_ID = $(this).find('input').val(),
                        field_title = $(this).find('.checkboxes_dropdown__label_title').attr('title');

                    if (!fields.includes(field_ID)) fields.push(field_ID);
                });
            });

            if (fields.length == 0) {
                $('.modal__fields__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#f57d7d');
                isError = true;
            } else leads.fields = fields;

            // добавляем параметр history
            var historyItems = $('.modal__history__wrapper .checkboxes_dropdown__item'),
                historyValues = [];

            $.each(historyItems, function () {
                $.each($(this).find('label'), function () {
                    if (!$(this).hasClass('is-checked')) return;
                    if ($(this).hasClass('js-master-checkbox-wrapper')) return;

                    var field_value = $(this).find('input').val();
                    if (!historyValues.includes(field_value)) historyValues.push(field_value);
                });
            });

            if (historyValues.length == 0) {
                $('.modal__history__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#f57d7d');
                isError = true;
            } else leads.history = historyValues;

            // добавляем параметр tags
            if ($('.modal__tags__wrapper label').hasClass('is-checked')) leads.tags = 'yes';
            else leads.tags = null;

            // добавляем параметр company
            if ($('.modal__company__wrapper label').hasClass('is-checked')) leads.company = 'yes';
            else leads.company = null;

            // добавляем параметр products
            if ($('.modal__products__wrapper label').hasClass('is-checked')) leads.products = self.products;
            else leads.products = null;

            // добавляем параметр contacts
            if (AMOCRM.isCard()) {
                var contactsItems = $('.modal__contacts__wrapper .checkboxes_dropdown__item'),
                    contacts = [];

                $.each(contactsItems, function () {
                    $.each($(this).find('label'), function () {
                        var contact, is_main = false;

                        if (!$(this).hasClass('is-checked')) return;
                        if ($(this).hasClass('js-master-checkbox-wrapper')) return;
                        if ($(this).hasClass('main__contact')) is_main = true;

                        var contact_ID = $(this).find('input').val(),
                            contact_title = $(this).find('.checkboxes_dropdown__label_title').attr('title');

                        if (is_main) contact = [contact_ID, 'main'];
                        else contact = [contact_ID];

                        if (!contacts.includes(contact)) contacts.push(contact);
                    });
                });

                var mainContact = $('.main__contact');
                var mainContactTitle = $('.main__contact .checkboxes_dropdown__label_title');

                if (contacts.length == 0 || !mainContact.hasClass('is-checked')) {
                    $('.modal__contacts__wrapper .checkboxes_dropdown__title_wrapper').css('border-color', '#f57d7d');
                    mainContactTitle.css('color', '#f57d7d');
                    isError = true;
                } else leads.contacts = contacts;
            } else leads.contacts = 'all';

            // если ошибки есть, останавливаем кнопку
            if (isError) return false;
            $('.modal-copypaste').remove();

            var _data = {};
            _data['domain'] = document.domain;
            _data['method'] = "copypasteLeads";
            _data['leads'] = leads;

            $.ajax({
                url: url_link_t,
                method: 'POST',
                data: _data,
                dataType: 'html',
                success: function (data) {
                    console.log(data);
                }
            });
        }

        // добавляем участников в настройки
        this.forUsers = function () {
            var linkUsers = `
                <div class="subscribers" style="margin-bottom: 15px; position: relative;">
                    <a href="" class="js-toggle linkUsers" style="font-size: 16px;">
                        Участники:&nbsp;
                        <span id="show-chat-list-length" class="js-counter">
                            0
                        </span>
                    </a>
                </div>
            `;

            // прячем ссылку участников
            $('.widget_settings_block__controls').prepend(linkUsers);

            // отображаем форму с пользователями
            $('a.linkUsers').unbind('click');
            $('a.linkUsers').bind('click', function (e) {
                e.preventDefault();

                // wrapper, кнопки и поиск
                $('.subscribers').append(`
                    <div class="subscribers-container js-container subscribers-container--full" style="display: block; width: 250px;">
                        <div class="js-view-container" style="background: #fff;">
                        
                            <div class="subscribers-full">
                                <div class="js-users-picker users-picker">
                                    <div data-multisuggest-id="5499">
                                    
                                        <div class="users-picker-controls js-users-picker-controls users-picker-controls--disabled" style="background: #fff;">
                                            <button class="users-picker-controls__cancel js-users-picker-controls-cancel" style="cursor: pointer;">
                                                Отменить
                                            </button>
                                            <button class="users-picker-controls__save js-users-picker-controls-save" style="cursor: pointer;">
                                                Сохранить
                                            </button>
                                        </div>
                                        
                                        <div class="users-picker-search" style="background: #fff;">
                                            <span class="users-picker-search__icon">
                                                <svg class="svg-icon svg-common--filter-search-dims">
                                                    <use xlink:href="#common--filter-search"></use>
                                                </svg>
                                            </span>
                                            <input class="users-picker-search__field js-multisuggest-input" style="width: 5px;">
                                            <tester style="position: absolute; top: -9999px; left: -9999px; width: auto; font-size: 14px; 
                                                font-family: &quot;PT Sans&quot;, Arial, sans-serif; font-weight: 400; font-style: normal; 
                                                letter-spacing: 0px; text-transform: none; white-space: pre;">
                                            </tester>
                                        </div>
                                        
                                    </div>
                                <div class="js-multisuggest-suggest" data-multisuggest-id="5499" style="display: block;">
                            </div>
                            
                            <div class="js-multisuggest-list" data-is-suggest="y" data-multisuggest-id="5499" style="display: block;">
                                <div class="multisuggest__suggest js-multisuggest-suggest custom-scroll">
                                    <div class="users-select-row">
                
                                    </div>
                         
                                </div>
                            </div>
                
                        </div>
                    </div>
                `);

                // пользователи и группы
                var groups = AMOCRM.constant('groups'),
                    managers = AMOCRM.constant('managers');

                // перебираем группы и пользователей этих групп
                $.each(groups, function (key, value) {
                    var users = [], groupID = key;

                    $.each(managers, function () {
                        if (this.group != key) return;
                        users.push({ id: this.id, title: this.title });
                    });

                    // добавляем группу, если в ней есть пользователи
                    if (!users.length) return;
                    $('.multisuggest__suggest').append(`
                        <div class="users-select-row__inner group-color-wrapper">
                            <div class="users-picker-item users-picker-item--group  users-select__head group-color multisuggest__suggest-item"
                                data-title="${ value }" data-group="y" data-id="${ groupID }">
                                <div class="users-picker-item__title users-select__head-title">
                                    <span>${ value }</span>
                                </div>
                                <div class="users-picker-item__pin">
                                    <svg class="svg-icon svg-cards--pin-dims">
                                        <use xlink:href="#cards--pin"></use>
                                    </svg>
                                </div>
                            </div>
                            <div class="users-select__body" data-id="${ groupID }"></div>
                        </div>
                    `);

                    // добавляем пользователей к группе
                    $.each(users, function () {
                        $(`.users-select__body[data-id="${ groupID }"]`).append(`
                            <div class="users-picker-item users-select__body__item"
                                id="select_users__user-${ this.id }" data-group="${ groupID }" data-id="${ this.id }">
                                <div class="users-picker-item__title multisuggest__suggest-item js-multisuggest-item true">
                                    ${ this.title }
                                </div>
                                <div class="users-picker-item__pin users-picker-select">
                                    <svg class="svg-icon svg-cards--pin-dims">
                                        <use xlink:href="#cards--pin"></use>
                                    </svg>
                                </div>
                            </div>
                        `);
                    });
                });

                // search
                $('.users-picker-search__field').bind('input', function () {
                    var searchVal = $(this).val().toLowerCase();

                    // перебираем пользователей на совпадения
                    $.each($('.users-picker-item__title'), function () {
                        var itemText = $(this).text().toLowerCase();

                        // если есть, остальных скрываем
                        if (!itemText.includes(searchVal)) {
                            if ($(this).parent().hasClass('users-picker-item--group')) return;
                            $(this).parent().addClass('hidden');
                        } else $(this).parent().removeClass('hidden');
                    });

                    // если в группе пользователей не осталось, прячем группу
                    $.each($('.users-select-row__inner'), function () {
                        var items = $(this).find('.users-select__body__item'),
                            counter = 0;

                        $.each(items, function () {
                            if ($(this).hasClass('hidden')) return;
                            counter++;
                        });

                        if (counter > 0) $(this).removeClass('hidden');
                        else $(this).addClass('hidden');
                    });
                });

                // отмечаем выбранных ранее пользователей
                $.each($('.users-select__body__item'), function () {
                    var itemID = $(this).attr('data-id');
                    if (!self.managers || !self.managers.includes(itemID)) return;
                    if ($(this).hasClass('users-picker-item--selected')) return;;
                    $(this).addClass('users-picker-item--selected');
                });

                // выбор пользователя
                $('.users-select__body__item').unbind('click');
                $('.users-select__body__item').bind('click', function (e) {
                    e.stopPropagation();
                    var userID = $(e.target).closest('.users-select__body__item').attr('data-id');
                    $(e.target).closest('.users-select__body__item').toggleClass('users-picker-item--selected');
                    $('.users-picker-controls').removeClass('users-picker-controls--disabled');
                });

                // выбор группы пользователей
                $('.users-picker-item--group').unbind('click');
                $('.users-picker-item--group').bind('click', function (e) {
                    e.stopPropagation();
                    var groupID = $(e.target).closest('.users-picker-item--group').attr('data-id');

                    $(e.target).closest('.users-picker-item--group').toggleClass('users-picker-item--selected');
                    groupItems = $(`.users-select__body[data-id="${ groupID }"]`).find('.users-select__body__item');
                    $('.users-picker-controls').removeClass('users-picker-controls--disabled');

                    if ($(`.users-picker-item--group[data-id="${ groupID }"]`).hasClass('users-picker-item--selected')) {
                        $.each(groupItems, function () {
                            if ($(this).hasClass('users-picker-item--selected')) return;
                            $(this).addClass('users-picker-item--selected');
                        });
                    } else {
                        $.each(groupItems, function () {
                            if (!$(this).hasClass('users-picker-item--selected')) return;
                            $(this).removeClass('users-picker-item--selected');
                        });
                    }
                });

                // выравниваем пользователей относительно ссылки
                $('.js-view-container').css('border', '1px solid #c3c3c3');
                $('.subscribers-container').css({
                    'left': '0',
                    'top': '0',
                    'border': '0'
                });

                // прячем список пользователей
                $('.widget-settings').unbind('click');
                $('.widget-settings').bind('click', function (e) {
                    // если это не ссылка, не счетчик и не сама форма, удаляем форму
                    if ($(e.target).closest('.subscribers-container').length) return;
                    if ($(e.target).hasClass('linkUsers')) return;
                    if ($(e.target).parent().hasClass('linkUsers')) return;
                    $('.subscribers-container').remove();
                });

                // события кнопок отменить и сохранить
                $('.js-users-picker-controls-cancel').bind('click', () => { $('.subscribers-container').remove() });
                $('.users-picker-controls__save').bind('click', function () {
                    var items = $('.users-select__body__item'),
                        managers = [];

                    $.each(items, function () {
                        if (!$(this).hasClass('users-picker-item--selected')) return;
                        managers.push($(this).attr('data-id'));
                    });

                    self.managers = managers;
                    $('.subscribers-container').remove();
                    $('.subscribers .js-counter').text(managers.length);

                    // обнуляем системную переменную
                    $(`#${ self.get_settings().widget_code }_custom`).val(JSON.stringify(self.managers));
                    $(`#${ self.get_settings().widget_code }_custom`).trigger('change');
                });

            });
        }

        this.callbacks = {
            settings: function() {
                // форма с пользователями и группами
                self.forUsers();

                // настройки из системной переменной для отображения выбранных пользователей
                self.managers = toArrayManagers();
                $('.subscribers .js-counter').text(self.managers.length);

                // Блок первичных настроек и авторизации
                var _settings = self.get_settings();
                var data = '<div id="settings_WidgetCopypasteLeads">Загружается...</div>';
                $('[id="settings_WidgetCopypasteLeads"]').remove();
                $('#' + _settings.widget_code + '_custom_content').parent().after(data);
                var _secret = $('p.js-secret').attr('title');
                var _data = {};
                _data["domain"] = document.domain;
                _data["settings"] = _settings;
                _data["secret"] = _secret;
                _data["method"] = "settings";
                $.ajax({
                    url: url_link_t,
                    method: 'post',
                    data: _data,
                    dataType: 'html',
                    success: function(data) {
                        $('[id="settings_WidgetCopypasteLeads"]').remove();
                        $('#' + _settings.widget_code + '_custom_content').parent().after(data);
                    }
                });
            },
            init: function() {
                return true;
            },
            bind_actions: function() {
                return true;
            },
            render: function() {
                // запуск модального окна в списках и карточке сделок
                self.linkToLeadsCard();
                self.observerLinkToLeadsTodo.observe($('body')[0], {
                    childList: true,
                    subtree: true,
                    attributes: true
                });

                return true;
            },
            contacts: {
                selected: function () {}
            },
            companies: {
                selected: function () {},
            },
            leads: {
                selected: function () {}
            },
            tasks: {
                selected: function() {}
            },
            destroy: function() {
                self.observerLinkToLeadsTodo.disconnect();
            },
            onSave: function() {
                var _settings = self.get_settings();
                var data = '<div id="settings_WidgetCopypasteLeads">Загружается...</div>';
                $('[id="settings_WidgetCopypasteLeads"]').remove();
                $('#' + _settings.widget_code + '_custom_content').parent().after(data);
                var _secret = $('p.js-secret').attr('title');
                var _data = {};
                _data["domain"] = document.domain;
                _data["settings"] = _settings;
                _data["settings"]["active"] = "Y";
                _data["secret"] = _secret;
                _data["method"] = "settings";
                $.ajax({
                    url: url_link_t,
                    method: 'post',
                    data: _data,
                    dataType: 'html',
                    success: function(data) {
                        $('[id="settings_WidgetCopypasteLeads"]').remove();
                        $('#' + _settings.widget_code + '_custom_content').parent().after(data);
                    }
                });

                return true;
            },
            advancedSettings: function() {}
        };
        return this;
    };
    return CustomWidget_WidgetCopypasteLeads;
});

// https://integratorgroup.k-on.ru/andreev/copypaste/token_get.php