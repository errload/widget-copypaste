<?php
	ini_set('error_log', 'error_in_templates.log');
    date_default_timezone_set('Europe/Moscow');
    // header('Content-type: application/html;charset=utf8');
    header('Content-type: text/html; charset=utf8');
	header('Access-Control-Allow-Origin: *');

    include_once 'config.php';

    use AmoCRM\Collections\ContactsCollection;
    use AmoCRM\Collections\LinksCollection;
    use AmoCRM\Exceptions\AmoCRMApiException;
    use AmoCRM\Models\ContactModel;
    use AmoCRM\Models\CustomFieldsValues\ValueCollections\NullCustomFieldValueCollection;
    use AmoCRM\Models\LeadModel;
    use AmoCRM\Helpers\EntityTypesInterface;
    use AmoCRM\Collections\NotesCollection;
    use AmoCRM\Collections\TasksCollection;
    use AmoCRM\Models\TaskModel;
    use AmoCRM\Filters\TasksFilter;

    $Config = new Config();

    if ($_POST['method'] == 'settings') {
        // echo 'Блок первичных настроек Авторизации виджета <br>';
        echo '<div id="settings_WidgetCopypasteLeads">';
        $path = $Config->Set_Path_From_Domain($_POST['domain']);
        $settings = $_POST['settings'];
        $settings['secret'] =  $_POST['secret'];
        $Config->SaveSettings($settings);

        if (($_POST['settings']['active'] == 'Y') || ($_POST['settings']['status'] == 'installed')) {
            echo $Config->Authorization();
            if ($Config->CheckToken()) include_once 'templates/advancedsettings.html';
        } else {
            $Config->deleteToken();
            echo 'Виджет еще не установлен. Установите. <br>';
        }

        echo '</div>';
        exit;
    }

    $Config->GetSettings($_POST['domain']);
    if ($Config->CheckToken()) $apiClient = $Config->getAMO_apiClient();
    else {
        if ($_POST['method'] == 'advancedsettings') echo $Config->Authorization();
        exit;
    }

    /* ##################################################################### */

    if ($_POST["method"] == "copypasteLeads" && $Config->CheckToken()) {
        foreach ($_POST['leads']['id'] as $leadID) {
            $leadInfo = $apiClient->leads()->getOne((int) $leadID, ['contacts', 'catalog_elements']);
            usleep(200);

            foreach ($_POST['leads']['pipelines'] as $pipeline) {
                $pipeline = explode('_', $pipeline);
                $piplineID = $pipeline[1];
                $statusID = $pipeline[2];

                $lead = new LeadModel();
                $lead
                    ->setName('Копия ' . $leadInfo->getName()) // имя
                    ->setResponsibleUserId($_POST['leads']['user']) // ответственный
                    ->setPrice($leadInfo->getPrice()) // прайс
                    ->setPipelineId($piplineID) // воронка
                    ->setStatusId($statusID); // статус

                // копируем все поля
                $lead->setCustomFieldsValues($leadInfo->getCustomFieldsValues());
                // удаляем те, которые не отмечены
                foreach ($lead->getCustomFieldsValues() as $field) {
                    if (in_array($field->getFieldId(), $_POST['leads']['fields'])) continue;
                    $field->setValues((new NullCustomFieldValueCollection()));
                }

                // копируем тэги, если отмечены
                if ($_POST['leads']['tags'] == 'yes') $lead->setTags($leadInfo->getTags());
                // копируем компанию, если отмечена
                if ($_POST['leads']['company'] == 'yes') $lead->setCompany($leadInfo->getCompany());

                // прикрепляем контакты
                if ($_POST['leads']['contacts'] == 'all') $lead->setContacts($leadInfo->getContacts());
                else {
                    $contactsCollection = new ContactsCollection();
                    foreach ($_POST['leads']['contacts'] as $contact) {
                        in_array('main', $contact) ? $is_main = true : $is_main = false;
                        $contactsCollection->add((new ContactModel())->setId($contact[0])->setIsMain($is_main));
                    }
                    $lead->setContacts($contactsCollection);
                }

                try {
                    $lead = $apiClient->leads()->addOne($lead);
                    usleep(200);
                } catch (AmoCRMApiException $e) {
                    printError($e);
                    die;
                }

                // перебираем товары и прикрепляем к ним ссылки для новой сделки
                if ($_POST['leads']['products'] == 'all') {
                    $linksCollection = new LinksCollection();
                    $catalogElementsLinks = $leadInfo->getCatalogElementsLinks();
                    foreach ($catalogElementsLinks as $catalogElement) $linksCollection->add($catalogElement);
                    if ($linksCollection->count()) $apiClient->leads()->link($lead, $linksCollection);
                    usleep(200);
                } else {
                    $linksCollection = new LinksCollection();
                    $catalogElementsLinks = $leadInfo->getCatalogElementsLinks();
                    foreach ($catalogElementsLinks as $catalogElement) {
                        if (!in_array($catalogElement->id, $_POST['leads']['products'])) continue;
                        $linksCollection->add($catalogElement);
                    }
                    if ($linksCollection->count()) $apiClient->leads()->link($lead, $linksCollection);
                    usleep(200);
                }

                // перебираем примечания и создаем такие же для новой сделки
                if (in_array('notes', $_POST['leads']['history'])) {
                    $leadNotesService = $apiClient->notes(EntityTypesInterface::LEADS);
                    usleep(200);

                    try {
                        $leadNotes = $leadNotesService->getByParentId($leadInfo->getId());
                        usleep(200);
                    } catch (AmoCRMApiException $e) { return; }

                    if ($leadNotes->count() > 0) $isNotes = true;
                    while ($isNotes) {
                        $notesCollection = new NotesCollection();

                        foreach ($leadNotes as $leadNote) {
                            $model = '\\' . get_class($leadNote);
                            if ($model == '\AmoCRM\Models\NoteType\AttachmentNote') continue;
                            $note = new $model();
                            $leadNote = (array) $leadNote;

                            foreach ($leadNote as $key => $val) {
                                $leadKey = $key;
                                $leadKey = str_replace('*', '', $leadKey);
                                $leadKey = 'set' . ucfirst(trim($leadKey));

                                if ($leadKey == 'setModelClass' || $leadKey == 'setId') continue;
                                if ($leadKey == 'setEntityId') $note->$leadKey($lead->getId());
                                else $note->$leadKey($val);
                            }

                            $notesCollection->add($note);
                        }

                        if ($leadNotes->getNextPageLink()) {
                            $leadNotes = $leadNotesService->nextPage($leadNotes);
                            usleep(200);
                            $isNotes = true;
                        } else $isNotes = false;

                        if ($notesCollection->count()) $leadNotesService->add($notesCollection);
                        usleep(200);
                    }
                }

                // создаем копии задач, если отмечены
                if (in_array('tasksFinish', $_POST['leads']['history']) ||
                    in_array('tasksNotFinish', $_POST['leads']['history'])) {

                    $filter = (new TasksFilter())
                        ->setEntityType('lead')
                        ->setEntityIds($leadInfo->getId())
                        ->setLimit(50);
                    $tasksCollection = $apiClient->tasks()->get($filter);
                    usleep(200);

                    if ($tasksCollection->count() > 0) $isTasks = true;
                    while ($isTasks) {
                        $taskCollection = new TasksCollection();

                        foreach ($tasksCollection as $task) {
                            if ($task->isCompleted && !in_array('tasksFinish', $_POST['leads']['history'])) continue;
                            if (!$task->isCompleted && !in_array('tasksNotFinish', $_POST['leads']['history'])) continue;

                            $newTask = new TaskModel();
                            $newTask
                                ->setResponsibleUserId($task->responsibleUserId)
                                ->setGroupId($task->groupId)
                                ->setCreatedBy($task->createdBy)
                                ->setUpdatedBy($task->updatedBy)
                                ->setCreatedAt($task->createdAt)
                                ->setUpdatedAt($task->updatedAt)
                                ->setAccountId($task->accountId)
                                ->setDuration($task->duration)
                                ->setEntityId($lead->getId())
                                ->setEntityType($task->entityType)
                                ->setIsCompleted($task->isCompleted)
                                ->setTaskTypeId($task->taskTypeId)
                                ->setText($task->text)
                                ->setResult($task->result)
                                ->setCompleteTill($task->completeTill);

                            $taskCollection->add($newTask);
                        }

                        if ($tasksCollection->getNextPageLink()) {
                            $tasksCollection = $apiClient->tasks()->nextPage($tasksCollection);
                            usleep(200);
                            $isTasks = true;
                        } else $isTasks = false;

                        if ($taskCollection->count()) $apiClient->tasks()->add($taskCollection);
                        usleep(200);
                    }
                }
                
            }
        }
    }

