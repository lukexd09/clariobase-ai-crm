import type { Dictionary } from "@/i18n/types";

export const plPL = {
  "metadata.title": "ClarioBase AI CRM",
  "metadata.description": "Produkcyjny obszar pracy CRM ClarioBase",
  "common.loading": "Wczytywanie...",
  "common.unavailable": "Niedostępne",
  "common.results": "{count} wyników",
  "shell.workspace": "Obszar pracy twórcy",
  "shell.menu": "Menu",
  "shell.closeNavigation": "Zamknij nawigację",
  "shell.primaryNavigation": "Główna nawigacja",
  "navigation.group.workspace": "Obszar pracy",
  "navigation.group.dataQuality": "Jakość danych",
  "navigation.group.system": "System",
  "navigation.dashboard": "Pulpit",
  "navigation.work": "Panel pracy",
  "navigation.leads": "Leady",
  "navigation.sales": "Operacje",
  "navigation.imports": "Importy",
  "navigation.duplicates": "Potencjalne duplikaty",
  "navigation.health": "Stan systemu",
  "auth.signIn.title": "Zaloguj się",
  "auth.signIn.description": "Użyj aktywnego konta, aby przejść do obszaru pracy.",
  "auth.signIn.email": "E-mail",
  "auth.signIn.password": "Hasło",
  "auth.signIn.security": "Sesję chronią pliki cookie Better Auth.",
  "auth.signIn.submit": "Zaloguj się",
  "auth.signIn.submitting": "Logowanie...",
  "auth.signIn.error": "Logowanie nie powiodło się. Sprawdź dane i spróbuj ponownie.",
  "auth.account.signIn": "Zaloguj się",
  "auth.account.signedInUser": "Zalogowany użytkownik",
  "auth.account.sessionActive": "Sesja aktywna",
  "auth.account.signOut": "Wyloguj się",
  "shared.pagination": "Stronicowanie",
  "shared.scrollableTable": "Przewijana tabela",
  "environment.testDescription": "Środowisko testowe. Dane mogą zostać zresetowane lub usunięte.",
  "taxonomy.NEW": "Nowy",
  "taxonomy.QUALIFIED": "Zakwalifikowany",
  "taxonomy.TO_AUDIT": "Do audytu",
  "taxonomy.AUDITED": "Po audycie",
  "taxonomy.CONTACTED": "Skontaktowano",
  "taxonomy.REPLIED": "Odpowiedział",
  "taxonomy.DISCOVERY_SCHEDULED": "Rozmowa zaplanowana",
  "taxonomy.OFFER_SENT": "Oferta wysłana",
  "taxonomy.WON": "Wygrany",
  "taxonomy.LOST": "Przegrany",
  "taxonomy.NURTURE": "Do podtrzymania",
  "taxonomy.BAD_FIT": "Niedopasowany",
  "taxonomy.DO_NOT_CONTACT": "Nie kontaktować się",
  "taxonomy.ARCHIVED": "Zarchiwizowany",
  "taxonomy.LOW": "Niski",
  "taxonomy.MEDIUM": "Średni",
  "taxonomy.HIGH": "Wysoki",
  "taxonomy.URGENT": "Pilny",
  "taxonomy.UNKNOWN": "Nieustalone",
  "taxonomy.BASE": "Base",
  "taxonomy.CLARITY": "Clarity",
  "taxonomy.MOMENTUM": "Momentum",
  "taxonomy.NOT_FIT": "Brak dopasowania",
  "taxonomy.NOTE": "Notatka",
  "taxonomy.CALL": "Rozmowa",
  "taxonomy.MESSAGE": "Wiadomość",
  "taxonomy.STATUS_CHANGE": "Zmiana statusu",
  "taxonomy.AUDIT": "Audyt",
  "taxonomy.OTHER": "Inne",
  "taxonomy.DRAFT": "Szkic",
  "taxonomy.READY_FOR_REVIEW": "Gotowy do weryfikacji",
  "taxonomy.APPROVED": "Zatwierdzony",
  "taxonomy.READY": "Gotowy",
  "taxonomy.SENT_MANUALLY": "Wysłany ręcznie",
  "taxonomy.ACCEPTED": "Przyjęty",
  "taxonomy.REJECTED": "Odrzucony",
  "taxonomy.EMAIL": "E-mail",
  "taxonomy.INSTAGRAM_DM": "Wiadomość na Instagramie",
  "taxonomy.FACEBOOK_DM": "Wiadomość na Facebooku",
  "taxonomy.PHONE_CALL": "Rozmowa telefoniczna",
  "taxonomy.RUNNING": "W toku",
  "taxonomy.COMPLETED": "Zakończony",
  "taxonomy.COMPLETED_WITH_ERRORS": "Zakończony z błędami",
  "taxonomy.FAILED": "Nieudany",
  "taxonomy.CREATED": "Utworzony",
  "taxonomy.UPDATED": "Zaktualizowany",
  "taxonomy.SKIPPED": "Pominięty",
  "taxonomy.LOCAL_JSON": "Lokalny JSON",
  "taxonomy.HARVESTER_EXPORT": "Eksport Harvester",
  "taxonomy.MANUAL_AI_PREPARED_FILE": "Ręcznie przygotowany plik AI",
  "taxonomy.OPEN": "Otwarty",
  "taxonomy.NEEDS_REVIEW": "Wymaga weryfikacji",
  "taxonomy.DISMISSED": "Odrzucony",
  "taxonomy.RESOLVED": "Rozstrzygnięty",
  "admin.role.admin": "Administrator",
  "admin.role.user": "Użytkownik",
  "admin.role.unknown": "Nieznana rola",
  "admin.state.active": "Aktywny",
  "admin.state.disabled": "Wyłączony",
  "notice.admin.user_created": "Utworzono użytkownika",
  "notice.admin.identity_updated": "Zaktualizowano dane użytkownika",
  "notice.admin.user_disabled": "Wyłączono użytkownika i unieważniono jego sesje",
  "notice.admin.user_reactivated": "Ponownie aktywowano użytkownika",
  "notice.admin.password_reset": "Zresetowano hasło i unieważniono sesje",
  "notice.admin.all_sessions_revoked": "Unieważniono wszystkie sesje użytkownika",
  "notice.admin.session_revoked": "Unieważniono sesję",
  "notice.admin.invalid_new_user_fields": "Sprawdź pola nowego użytkownika",
  "notice.admin.invalid_identity_fields": "Sprawdź dane użytkownika",
  "notice.admin.invalid_user": "Nieprawidłowy użytkownik",
  "notice.admin.invalid_session": "Nieprawidłowa sesja",
  "notice.admin.invalid_password_length": "Hasło musi mieć od 12 do 128 znaków",
  "notice.admin.user_not_found": "Nie znaleziono użytkownika",
  "notice.admin.session_not_found": "Nie znaleziono sesji",
  "notice.admin.self_lockout": "Administrator nie może wykonać tej operacji na własnym koncie",
  "notice.admin.last_active_admin": "Nie można wyłączyć ostatniego aktywnego administratora",
  "notice.admin.invalid_admin_user": "Dostawca uwierzytelniania zwrócił nieprawidłowego użytkownika",
  "notice.admin.unauthorized": "Wymagane logowanie",
  "notice.admin.forbidden": "Wymagane uprawnienia aktywnego administratora",
  "notice.admin.admin_provider_error": "Operacja administracyjna nie powiodła się",
  "notice.admin.admin_operation_failed": "Operacja administracyjna nie powiodła się"
  ,"dashboard.title": "Pulpit"
  ,"dashboard.prioritiesFor": "Priorytety na {date}"
  ,"dashboard.metrics": "Wskaźniki pulpitu"
  ,"dashboard.metric.overdue": "Po terminie"
  ,"dashboard.metric.dueToday": "Na dziś"
  ,"dashboard.metric.upcoming": "Nadchodzące"
  ,"dashboard.metric.idle": "Bez działania"
  ,"dashboard.todayPriorities": "Dzisiejsze priorytety"
  ,"dashboard.deadline": "Termin:"
  ,"dashboard.open": "Otwórz"
  ,"dashboard.openCompany": "Otwórz {company}"
  ,"dashboard.pipeline": "Stan lejka sprzedaży"
  ,"dashboard.warning": "Ostrzeżenie"
  ,"dashboard.dataQuality": "Ostrzeżenie o jakości danych"
  ,"dashboard.duplicates": "3 potencjalne duplikaty wymagają weryfikacji"
  ,"dashboard.review": "Sprawdź"
  ,"dashboard.priority.lumina.action": "Wyślij poprawiony szkic"
  ,"dashboard.priority.lumina.context": "Właścicielka poprosiła o prostsze podsumowanie obszaru pracy i potwierdzenie, że hosting jest wliczony."
  ,"dashboard.priority.lumina.deadline": "Dziś, 15:30"
  ,"dashboard.priority.aurora.action": "Potwierdź przebieg rezerwacji"
  ,"dashboard.priority.aurora.context": "Obecny formularz zapytania ma zbyt wiele kroków przed wysłaniem prośby o termin."
  ,"dashboard.priority.aurora.deadline": "Jutro, 09:00"
  ,"dashboard.priority.sienna.action": "Wyślij podsumowanie weryfikacji"
  ,"dashboard.priority.sienna.context": "Wczoraj zakończono weryfikację, a klient czeka na następny krok."
  ,"dashboard.priority.sienna.deadline": "Dziś, 16:00"
  ,"dashboard.priority.velvet.action": "Zaplanuj kolejny kontakt"
  ,"dashboard.priority.velvet.context": "Po wysłaniu poprzedniej aktualizacji nie utworzono następnego zadania."
  ,"dashboard.priority.velvet.deadline": "Brak terminu"
  ,"dashboard.pipeline.new": "Nowe"
  ,"dashboard.pipeline.contacted": "Po kontakcie"
  ,"dashboard.pipeline.qualified": "Zakwalifikowane"
  ,"dashboard.pipeline.proposalSent": "Oferta wysłana"
  ,"dashboard.pipeline.won": "Wygrane"
  ,"work.eyebrow": "Kolejka operatora"
  ,"work.title": "Kolejka pracy"
  ,"work.bucket.overdue.title": "Działania po terminie"
  ,"work.bucket.overdue.description": "Leady, które wymagają już uwagi."
  ,"work.bucket.dueToday.title": "Na dziś"
  ,"work.bucket.dueToday.description": "Leady z kontaktem zaplanowanym na dziś."
  ,"work.bucket.upcoming.title": "Nadchodzące działania"
  ,"work.bucket.upcoming.description": "Najbliższe zaplanowane działania."
  ,"work.bucket.noAction.title": "Brak następnego działania"
  ,"work.bucket.noAction.description": "Aktywne leady, które nadal potrzebują konkretnego następnego kroku."
  ,"work.leadCount": "Liczba leadów: {count}"
  ,"work.table": "Tabela: {bucket}"
  ,"work.caption": "Kolejka pracy: {bucket}"
  ,"work.business": "Firma"
  ,"work.city": "Miasto"
  ,"work.category": "Kategoria"
  ,"work.status": "Status"
  ,"work.priority": "Priorytet"
  ,"work.match": "Dopasowanie"
  ,"work.score": "Wynik"
  ,"work.nextTask": "Następne zadanie"
  ,"work.action": "Działanie"
  ,"work.quickUpdate": "Szybka aktualizacja"
  ,"work.empty": "Brak rekordów w tej grupie."
  ,"leads.eyebrow": "Obszar pracy"
  ,"leads.title": "Leady"
  ,"leads.description": "Filtruj kolejkę, sprawdzaj bieżący zakres wyników i otwieraj rekordy do dalszej pracy."
  ,"leads.result.empty": "0 leadów"
  ,"leads.result.range": "{start}-{end} z {total} leadów"
  ,"leads.resultSummary": "Podsumowanie wyników"
  ,"leads.updating": "Aktualizowanie..."
  ,"leads.clearFilters": "Wyczyść filtry"
  ,"leads.filterLegend": "Filtruj leady"
  ,"leads.filter.status": "Status"
  ,"leads.filter.priority": "Priorytet"
  ,"leads.filter.city": "Miasto"
  ,"leads.filter.match": "Dopasowanie"
  ,"leads.activeFilters": "Aktywne filtry"
  ,"leads.filter.all": "Wszystkie"
  ,"leads.table": "Tabela leadów"
  ,"leads.caption": "Rekordy zgodne z bieżącymi filtrami"
  ,"leads.column.business": "Firma"
  ,"leads.column.city": "Miasto"
  ,"leads.column.category": "Kategoria"
  ,"leads.column.status": "Status"
  ,"leads.column.priority": "Priorytet"
  ,"leads.column.match": "Dopasowanie"
  ,"leads.column.score": "Wynik"
  ,"leads.column.nextTask": "Następne zadanie"
  ,"leads.empty": "Żaden rekord nie pasuje do bieżących filtrów."
  ,"leads.pagination": "Stronicowanie leadów"
  ,"leads.pageOf": "Strona {page} z {total}"
  ,"leads.previous": "Poprzednia"
  ,"leads.next": "Następna"
  ,"lead.update.status": "Status"
  ,"lead.update.statusHint": "Wybierz bieżący status pracy nad leadem."
  ,"lead.update.priority": "Priorytet"
  ,"lead.update.priorityHint": "Wybierz priorytet odpowiadający pilności następnego kontaktu."
  ,"lead.update.nextTask": "Następne zadanie"
  ,"lead.update.noSchedule": "Nie zaplanowano jeszcze następnego zadania."
  ,"lead.update.currentSchedule": "Bieżący termin: {date}"
  ,"lead.update.saving": "Zapisywanie..."
  ,"lead.update.save": "Zapisz zmiany"
  ,"notice.lead.unauthorized": "Wymagane logowanie"
  ,"notice.lead.nextActionInvalid": "Termin następnego działania musi być prawidłowy"
  ,"notice.lead.activityTitleRequired": "Tytuł aktywności jest wymagany"
  ,"notice.lead.activityDateInvalid": "Data aktywności musi być prawidłowa"
  ,"notice.lead.miniAuditDateInvalid": "Data zatwierdzenia musi być prawidłowa"
  ,"notice.lead.miniAuditContentRequired": "Uzupełnij co najmniej jedno pole treści miniaudytu"
  ,"notice.lead.outreachDateInvalid": "Data wysłania musi być prawidłowa"
  ,"notice.lead.outreachMessageRequired": "Wiadomość jest wymagana"
  ,"notice.lead.offerValidUntilInvalid": "Data ważności musi być prawidłowa"
  ,"notice.lead.offerSentAtInvalid": "Data wysłania musi być prawidłowa"
  ,"notice.lead.offerAcceptedAtInvalid": "Data przyjęcia musi być prawidłowa"
  ,"notice.lead.offerRejectedAtInvalid": "Data odrzucenia musi być prawidłowa"
  ,"notice.lead.offerPriceInvalid": "Cena netto musi być nieujemną liczbą"
  ,"notice.lead.offerCurrencyInvalid": "Waluta musi być trzyliterowym kodem"
  ,"notice.lead.offerTitleRequired": "Tytuł jest wymagany"
  ,"notice.lead.invalidUpdate": "Sprawdź pola aktualizacji leada"
  ,"notice.lead.updated": "Zaktualizowano leada"
  ,"notice.lead.invalidActivity": "Sprawdź pola aktywności"
  ,"notice.lead.activityAdded": "Dodano aktywność"
  ,"notice.lead.invalidMiniAudit": "Sprawdź pola szkicu miniaudytu"
  ,"notice.lead.miniAuditNotFound": "Nie znaleziono szkicu miniaudytu"
  ,"notice.lead.miniAuditCreated": "Utworzono szkic miniaudytu"
  ,"notice.lead.miniAuditUpdated": "Zaktualizowano szkic miniaudytu"
  ,"notice.lead.invalidOutreach": "Sprawdź pola szkicu kontaktu"
  ,"notice.lead.outreachNotFound": "Nie znaleziono szkicu kontaktu"
  ,"notice.lead.outreachCreated": "Utworzono szkic kontaktu"
  ,"notice.lead.outreachUpdated": "Zaktualizowano szkic kontaktu"
  ,"notice.lead.invalidOffer": "Sprawdź pola szkicu oferty"
  ,"notice.lead.offerNotFound": "Nie znaleziono szkicu oferty"
  ,"notice.lead.offerCreated": "Utworzono szkic oferty"
  ,"notice.lead.offerUpdated": "Zaktualizowano szkic oferty"
  ,"notice.lead.operationFailed": "Operacja nie powiodła się"
  ,"common.saving": "Zapisywanie..."
  ,"common.none": "Brak"
  ,"draft.named": "Szkic {id}"
  ,"draft.updateExisting": "Zaktualizuj istniejący szkic poniżej."
  ,"draft.new": "Nowy szkic"
  ,"draft.status": "Status"
  ,"activity.add": "Dodaj aktywność"
  ,"activity.addManual": "Dodaj aktywność ręcznie"
  ,"activity.type": "Typ"
  ,"activity.title": "Tytuł"
  ,"activity.titlePlaceholder": "Podsumowanie krótkiej rozmowy"
  ,"activity.titleHint": "Użyj krótkiego podsumowania, które później łatwo przejrzeć."
  ,"activity.occurredAt": "Czas wystąpienia"
  ,"activity.occurredAtHint": "Puste pole oznacza bieżący czas lokalny."
  ,"activity.body": "Treść"
  ,"activity.bodyPlaceholder": "Notatki, kontekst lub następny krok..."
  ,"activity.bodyHint": "Zapisz notatki, wiadomości, decyzje i kontekst dalszych działań."
  ,"activity.timeline": "Oś aktywności"
  ,"activity.empty": "Brak aktywności."
  ,"activity.occurred": "Wystąpiło"
  ,"activity.created": "Utworzono"
  ,"miniAudit.create": "Utwórz szkic weryfikacji"
  ,"miniAudit.createDescription": "Utwórz pierwszy szkic weryfikacji dla tego leada."
  ,"miniAudit.save": "Zapisz szkic weryfikacji"
  ,"miniAudit.statusHint": "Ustaw bieżący etap weryfikacji szkicu."
  ,"miniAudit.finding1": "Ustalenie 1"
  ,"miniAudit.finding1Hint": "Pierwsze kluczowe ustalenie do omówienia."
  ,"miniAudit.finding2": "Ustalenie 2"
  ,"miniAudit.finding2Hint": "Drugie kluczowe ustalenie do omówienia."
  ,"miniAudit.finding3": "Ustalenie 3"
  ,"miniAudit.finding3Hint": "Trzecie kluczowe ustalenie do omówienia."
  ,"miniAudit.approvedAt": "Zatwierdzono"
  ,"miniAudit.approvedAtHint": "Opcjonalny lokalny czas zatwierdzenia przez operatora."
  ,"miniAudit.reviewNote": "Notatka z weryfikacji"
  ,"miniAudit.reviewNoteHint": "Krótkie podsumowanie weryfikacji."
  ,"miniAudit.messageAngle": "Kierunek wiadomości"
  ,"miniAudit.messageAngleHint": "Punkt wyjścia do pierwszej wiadomości."
  ,"miniAudit.draftNote": "Treść szkicu"
  ,"miniAudit.draftNoteHint": "Przygotowana treść notatki."
  ,"miniAudit.riskNotes": "Uwagi o ryzyku"
  ,"miniAudit.riskNotesHint": "Możliwe zastrzeżenia lub ograniczenia."
  ,"outreach.create": "Utwórz szkic wiadomości"
  ,"outreach.createDescription": "Utwórz pierwszy szkic wiadomości dla tego leada."
  ,"outreach.save": "Zapisz szkic wiadomości"
  ,"outreach.statusHint": "Ustaw bieżący etap szkicu kontaktu."
  ,"outreach.channel": "Kanał"
  ,"outreach.channelHint": "Wybierz kanał, dla którego przygotowano szkic."
  ,"outreach.linkedReview": "Powiązana weryfikacja"
  ,"outreach.linkedReviewHint": "Opcjonalnie powiąż ze wspierającym szkicem weryfikacji."
  ,"outreach.subject": "Temat"
  ,"outreach.subjectHint": "Opcjonalny temat wiadomości e-mail."
  ,"outreach.sentAt": "Wysłano"
  ,"outreach.sentAtHint": "Opcjonalny lokalny czas ręcznej wysyłki."
  ,"outreach.openingLine": "Pierwsze zdanie"
  ,"outreach.openingLineHint": "Pierwsze zdanie dopasowane do leada."
  ,"outreach.message": "Wiadomość"
  ,"outreach.messageHint": "Przygotowana treść kontaktu."
  ,"outreach.nextStep": "Następny krok"
  ,"outreach.nextStepHint": "Co powinno wydarzyć się dalej."
  ,"outreach.notes": "Notatki"
  ,"outreach.notesHint": "Wewnętrzny kontekst lub przypomnienia."
  ,"offer.create": "Utwórz szkic"
  ,"offer.createDescription": "Utwórz pierwszy szkic oferty dla tego leada."
  ,"offer.save": "Zapisz szkic"
  ,"offer.statusHint": "Ustaw bieżący etap szkicu oferty."
  ,"offer.title": "Tytuł"
  ,"offer.titleHint": "Wymagany tytuł oferty."
  ,"offer.price": "Cena"
  ,"offer.priceHint": "Opcjonalna cena liczbowa."
  ,"offer.currency": "Waluta"
  ,"offer.currencyHint": "Domyślnie PLN."
  ,"offer.expires": "Ważna do"
  ,"offer.expiresHint": "Opcjonalny lokalny czas wygaśnięcia."
  ,"offer.sentAt": "Wysłano"
  ,"offer.sentAtHint": "Lokalny czas ręcznej wysyłki."
  ,"offer.acceptedAt": "Przyjęto"
  ,"offer.acceptedAtHint": "Opcjonalny lokalny czas przyjęcia."
  ,"offer.rejectedAt": "Odrzucono"
  ,"offer.rejectedAtHint": "Opcjonalny lokalny czas odrzucenia."
  ,"offer.scopeSummary": "Podsumowanie zakresu"
  ,"offer.scopeSummaryHint": "Co obejmuje oferta."
  ,"offer.assumptions": "Założenia"
  ,"offer.assumptionsHint": "Na jakich założeniach opiera się cena."
  ,"offer.nextStep": "Następny krok"
  ,"offer.nextStepHint": "Co powinno wydarzyć się po tym szkicu."
  ,"offer.rejectionReason": "Powód odrzucenia"
  ,"offer.rejectionReasonHint": "Opcjonalna notatka o odrzuceniu."
  ,"lead.detail.noNextAction": "Brak następnego działania"
  ,"lead.detail.noCity": "Brak miasta"
  ,"lead.detail.noCategory": "Brak kategorii"
  ,"lead.detail.noRegionCountry": "Brak regionu i kraju"
  ,"lead.detail.status": "Status"
  ,"lead.detail.activityLog": "Dziennik aktywności"
  ,"lead.detail.review": "Weryfikacja"
  ,"lead.detail.messagePlan": "Plan kontaktu"
  ,"lead.detail.draft": "Szkic"
  ,"lead.detail.internalDetails": "Dane wewnętrzne"
  ,"lead.detail.breadcrumb": "Ścieżka leada"
  ,"lead.detail.openWorkbench": "Otwórz panel pracy"
  ,"lead.detail.operatorWorkspace": "Obszar pracy operatora"
  ,"lead.detail.readiness": "Gotowość"
  ,"lead.detail.priorityValue": "Priorytet: {value}"
  ,"lead.detail.recommendedNextStep": "Zalecany następny krok"
  ,"lead.detail.localTime": "Czas lokalny operatora."
  ,"lead.detail.contactPerson": "Osoba kontaktowa"
  ,"lead.detail.noContactPerson": "Brak osoby kontaktowej"
  ,"lead.detail.noDirectContact": "Brak bezpośrednich danych kontaktowych"
  ,"lead.detail.website": "Strona WWW"
  ,"lead.detail.phone": "Telefon"
  ,"lead.detail.email": "E-mail"
  ,"lead.detail.sections": "Sekcje obszaru pracy operatora"
  ,"lead.detail.businessContext": "Kontekst firmy"
  ,"lead.detail.businessContextDescription": "Zwięzły kontekst dla operatora bez powtarzania statusu i pakietu."
  ,"lead.detail.notProvided": "Nie podano"
  ,"lead.detail.category": "Kategoria"
  ,"lead.detail.city": "Miasto"
  ,"lead.detail.regionCountry": "Region i kraj"
  ,"lead.detail.address": "Adres"
  ,"lead.detail.source": "Źródło"
  ,"lead.detail.lastReviewed": "Ostatnia weryfikacja"
  ,"lead.detail.notStarted": "Nie rozpoczęto"
  ,"lead.detail.reviewEmpty": "Utwórz pierwszą weryfikację, gdy lead będzie gotowy."
  ,"lead.detail.outreachEmpty": "Utwórz pierwszy szkic wiadomości, gdy kontakt będzie gotowy."
  ,"lead.detail.draftPreparation": "Przygotowanie szkicu"
  ,"lead.detail.offerEmpty": "Utwórz pierwszy szkic, gdy lead będzie gotowy."
  ,"lead.detail.showTechnical": "Pokaż dane techniczne"
  ,"lead.detail.technicalDescription": "Identyfikatory źródłowe i znaczniki audytowe są dostępne tutaj."
  ,"lead.detail.technicalMetadata": "Metadane techniczne"
  ,"lead.detail.sourceRecordId": "Identyfikator rekordu źródłowego"
  ,"lead.detail.googlePlaceId": "Google Place ID"
  ,"lead.detail.createdAt": "Utworzono"
  ,"lead.detail.updatedAt": "Zaktualizowano"
  ,"lead.detail.lastImportedAt": "Ostatni import"
  ,"lead.detail.archivedAt": "Zarchiwizowano"
  ,"lead.detail.statusUpdate": "Aktualizacja statusu"
  ,"lead.detail.statusDescription": "Dopasuj status, priorytet i następne zadanie do najnowszej pracy."
  ,"lead.detail.activityHeading": "Notatki, wiadomości i aktualizacje"
  ,"lead.detail.recommendation.prepareReview": "Przygotuj weryfikację"
  ,"lead.detail.recommendation.prepareReviewDescription": "Nie ma jeszcze szkicu weryfikacji. Zacznij od ustaleń, dopasowania i kierunku pierwszej wiadomości."
  ,"lead.detail.recommendation.openActivity": "Otwórz dziennik aktywności"
  ,"lead.detail.recommendation.prepareMessage": "Przygotuj plan kontaktu"
  ,"lead.detail.recommendation.prepareMessageDescription": "Lead ma podstawę weryfikacji, więc następnym praktycznym krokiem jest szkic wiadomości."
  ,"lead.detail.recommendation.reviewStatus": "Sprawdź status"
  ,"lead.detail.recommendation.prepareDraft": "Przygotuj szkic"
  ,"lead.detail.recommendation.prepareDraftDescription": "Lead ma wystarczający kontekst wcześniejszych etapów. Utwórz pierwszy szkic."
  ,"lead.detail.recommendation.reviewDraft": "Sprawdź szkic"
  ,"lead.detail.recommendation.reviewDraftDescription": "Najnowszy szkic nadal jest aktywny ({status}). Sprawdź go przed dalszym działaniem."
  ,"lead.detail.recommendation.logOrUpdate": "Dodaj aktywność lub zaktualizuj status"
  ,"lead.detail.recommendation.logOrUpdateDescription": "Podstawowe elementy procesu już istnieją. Dodaj aktywność lub doprecyzuj stan operacyjny."
  ,"lead.detail.recommendation.logActivity": "Dodaj aktywność"
  ,"lead.detail.recommendation.updateLead": "Zaktualizuj leada"
  ,"lead.detail.artifactNotStarted": "{name}: nie rozpoczęto"
  ,"lead.detail.artifactReady": "{name}: gotowe"
  ,"lead.detail.reviewDescription": "Utwórz pierwszy szkic weryfikacji i kierunek wiadomości."
  ,"lead.detail.reviewReady": "Zwięzła weryfikacja jest gotowa."
  ,"lead.detail.outreachDescription": "Przygotuj pierwszy plan kontaktu, kanał i dane dalszych działań."
  ,"lead.detail.outreachReady": "Najnowszy szkic kontaktu jest gotowy."
  ,"lead.detail.draftNotStarted": "Nie rozpoczęto szkicu"
  ,"lead.detail.offerDescription": "Przygotuj pierwszy szkic, gdy lead będzie gotowy."
  ,"lead.detail.noPrice": "Nie ustawiono ceny"
  ,"lead.detail.createFirstDraft": "Utwórz pierwszy szkic"
  ,"lead.detail.openEditor": "Otwórz edytor"
  ,"lead.detail.updated": "Zaktualizowano {date}"
} as const satisfies Dictionary;
