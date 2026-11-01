# HODLWARE – Geschützter Merchant-Center-Einrichtungsimport

Stand: 01.11.2026. Branch: `feature/merchant-setup-import`. Ausgangsstand: produktiver Commit `15291a4be5d3dcd169a363ae0284a1fd2e138079`; GitHub-main wurde lesend auf diesen Stand geprüft.

**Ausschließlich lokal vorbereitet. Kein Push, Deployment, Produktimport oder Ändern produktiver Feed-Schalter. Keine Preis-, Bestands-, Stripe- oder Checkoutänderung.**

## Ergebnis und Aufbau

Neuer separater Endpunkt: `/google-merchant-setup-feed.xml`.

Er verwendet dieselben Produktmetadaten, Preise und lesenden D1-Verfügbarkeitsabfragen wie der bestehende Feed. Alle sechs bekannten IDs sind verpflichtend: `seedplate`, `recoveryplate4`, `void-1`, `void-5`, `void-10`, `void-25`. Fehlende, zusätzliche oder ersetzte Angebote sperren die Einrichtungsdatei; keine ungeprüfte Erweiterung und kein Teilfeed.

Der Einrichtungsrenderer ergänzt jedes Angebot zwingend um die fest im Code hinterlegten Zielausschlüsse. Sie können weder durch URL-Parameter noch durch Anfrageheader oder Renderoptionen entfernt werden. Nicht unterstützte Query-Parameter sperren den Endpunkt. Es gibt keinen Parameter, mit dem auf diesem Endpunkt eine normale, nicht ausgeschlossene Produktausgabe angefordert werden kann.

Die Produktverfügbarkeit wird nicht künstlich auf ausverkauft gesetzt. Der normale Preis-/Bestandsinhalt bleibt korrekt; die Auslieferung wird separat über die dafür vorgesehenen Google-Attribute ausgeschlossen. Keine neuen Versandpreis-Overrides.

## Geprüfte Google-Vorgaben und Ausschlüsse

Primärquellen, geprüft am 01.11.2026:

- [Ausgeschlossenes Ziel](https://support.google.com/merchants/answer/6324486?hl=en): wiederholbares Attribut, im XML ein eigenes Element je Ziel; Ausschlüsse verhindern die Auslieferung an diese Ziele.
- [Eingeschlossenes Ziel](https://support.google.com/merchants/answer/7501026?hl=en): bei widersprüchlichen Angaben haben Ausschlüsse Vorrang.
- [Produktdateien](https://support.google.com/merchants/answer/12631822?hl=en): XML/RSS ist ein unterstütztes Importformat.

Die beiden zwingenden Werte sind **`Shopping_ads`** und **`Free_listings`**. Jedes der sechs Angebote enthält darüber hinaus die übrigen aktuell dokumentierten Ziele:

| Wert | Ausgeschlossene Verwendung |
|---|---|
| `Shopping_ads` | Shopping-Anzeigen |
| `Free_listings` | kostenlose Produkteinträge |
| `Display_ads` | dynamisches Remarketing entsprechend Googles Definition |
| `Local_inventory_ads` | Anzeigen für lokales Inventar |
| `Free_local_listings` | kostenlose lokale Produkteinträge |
| `Cloud_retail` | Weitergabe an verknüpftes Cloud-Retail-Projekt |
| `Local_cloud_retail` | lokale Cloud-Retail-Weitergabe |
| `Youtube_affiliate` | YouTube-Affiliate-Verwendung |
| `Youtube_merchandise` | YouTube-Shopping-/Merchandise-Verwendung |

Beispiel je Angebot:

```xml
<g:excluded_destination>Shopping_ads</g:excluded_destination>
<g:excluded_destination>Free_listings</g:excluded_destination>
```

Insgesamt enthält der vollständige Einrichtungsfeed **54 Ausschlusselemente**, neun pro Angebot. Es gibt keine `included_destination`-Elemente.

Google nennt für `Display_ads` eine Abhängigkeit vom Remarketing-Add-on und weist auf Grenzen dieses einzelnen Ausschlusses bei Performance Max hin. Es wird kein Add-on und keine Kampagne aktiviert. Falls Google beim späteren Import einen Zusatzwert beanstandet, bleibt die Auslieferung gesperrt; nicht ungeprüft Ausschlüsse entfernen, um die Importdiagnose grün zu bekommen. Die Pflichtausschlüsse für Shopping und kostenlose Einträge müssen stets erhalten bleiben. Eine offizielle Verarbeitung dieser konkreten Datei wurde noch nicht getestet, weil ein tatsächlicher Import ausdrücklich nicht freigegeben ist.

## Unveränderte Produktdaten und Versandlabels

| ID | Preis | Versandlabel |
|---|---:|---|
| `seedplate` | 79,00 € | `plate_parcel` |
| `recoveryplate4` | 79,00 € | `plate_parcel` |
| `void-1` | 0,99 € | `sticker_letter` |
| `void-5` | 3,49 € | `sticker_letter` |
| `void-10` | 5,99 € | `sticker_letter` |
| `void-25` | 11,99 € | `sticker_letter` |

Beträge sind weiterhin zentral aus `server/catalog.js` abgeleitet, nicht in einer zweiten Preisquelle gepflegt. Bild- und Produktadressen sowie bestätigte fehlende Herstellerkennungen bleiben erhalten. Alle Pakete verwenden weiterhin den gemeinsamen physischen Stickerbestand. Kein neuer Schreibzugriff auf D1.

## Separate Freigabelogik

Die alten Schalter alleine erlauben keinen Einrichtungsimport: Sie verlangen bewusst bereits überprüften Versand für eine normale Produktausgabe. Sie werden nicht umgedeutet oder aufgehoben.

Der neue Endpunkt liefert nur dann XML mit Angeboten, wenn gleichzeitig gilt:

```text
MERCHANT_SETUP_FEED_ENABLED=true
MERCHANT_SETUP_COUNTRY_CONFIRMED=DE
MERCHANT_FEED_ENABLED=false
MERCHANT_SHIPPING_REVIEWED=false
```

Die neuen Variablen werden ausschließlich in `.dev.vars.example` dokumentiert, standardmäßig deaktiviert bzw. leer. **`wrangler.toml`, tatsächliche Cloudflare-Variablen und produktive Secrets wurden nicht geändert.**

Sobald `MERCHANT_SETUP_FEED_ENABLED=true` ist, sperrt sich der normale Feed zusätzlich. Auch eine widersprüchliche Konfiguration mit gleichzeitig eingeschalteter Normalfreigabe ergibt keine ungeschützte Ausgabe: beide Endpunkte bleiben dann gesperrt. Es gibt keinen automatischen Übergang vom Einrichtungs- zum Verkaufsfeed.

Fehlende Freigaben, falsche Länderbestätigung, fehlende Lagerdaten oder andere Fehler ergeben HTTP 503 ohne Produkte und ohne interne Fehlerdetails. GET/HEAD sind erlaubt, andere Methoden ergeben 405. Kein Cookie, keine Bestandsreservierung, kein statischer Ersatzfeed. `Cache-Control: no-store`; zusätzlich `X-Robots-Tag: noindex, nofollow, noarchive`. Der Robots-Header ist nur ein ergänzender Indexierungshinweis und ersetzt keine Zielausschlüsse.

## Ausschließlich Deutschland – was technisch geprüft wird

`MERCHANT_SETUP_POLICY` und der generierte Konfigurationsvertrag `import-policy.json` erlauben ausschließlich **DE**, Produktsprache **de**, Feedlabel **DE**. Ein fehlender, fremder oder kombinierter Wert wie `FR` oder `DE,FR` in der Länderbestätigung sperrt den Endpunkt.

**Wichtige Grenze:** `MERCHANT_SETUP_COUNTRY_CONFIRMED=DE` ist eine Betreiberbestätigung. Der Endpunkt authentifiziert sich nicht beim Merchant Center und liest dessen Datenquellenkonfiguration nicht aus. Er kann deshalb nicht beweisen, dass im Google-Konto tatsächlich nur Deutschland ausgewählt wurde. RSS-Sprache und Feedlabel sind kein Ersatz für die Zielländerauswahl; es wird kein erfundenes XML-Attribut `target_country` hinzugefügt.

Vor dem später genehmigten Import zwingend im tatsächlichen Datenquellen-Dialog alle acht vorgeschlagenen Länder abwählen und ausschließlich Deutschland auswählen. Sprache Deutsch und Feedlabel DE einstellen. Die Auswahl vor dem ersten Import sowie die gespeicherte Datenquelle unmittelbar danach überprüfen und belegen. Ohne diese Prüfung weder Bestätigung setzen noch Import auslösen. `import-policy.json` ist ein Prüfvertrag, **kein fertiger Merchant-API-Aufruf und kein Nachweis einer gespeicherten Google-Einstellung**.

## Kann der Modus öffentliche Auslieferung verhindern?

**Auf Ebene der erzeugten Produktdaten ja:** Für alle sechs Angebote werden die dokumentierten Auslieferungsziele obligatorisch ausgeschlossen, unabhängig von Preisen und Verfügbarkeit. Die Schutzschalter verhindern eine versehentliche Ausgabe des normalen Verkaufsfeeds im Einrichtungsbetrieb.

**Eine globale Garantie über Google wäre unzutreffend:** Der Code kontrolliert nicht andere Datenquellen, manuelle Produktänderungen, automatische Quellen, spätere Regeländerungen, neu eingeführte Google-Ziele oder Googles tatsächliche Verarbeitung. Bestehende organische Suchergebnisse und die öffentlich erreichbaren HODLWARE-Produktseiten werden durch diese Attribute nicht entfernt. Der XML-Endpunkt wäre nach separat freigegebener Aktivierung selbst abrufbar; „öffentlich abrufbare Datei“ und „öffentliche Produktlistings“ sind unterschiedliche Freigaben.

Deshalb vor und nach dem Erstimport kontrollieren, dass keine andere Quelle die Ausschlüsse ersetzt, keine Angebote für Anzeigen/Einträge auslieferbar sind und Google alle neun Ausschlüsse korrekt verarbeitet hat. Nicht auf eine bloße allgemeine Statusanzeige „genehmigt“ verlassen: die tatsächlichen Ziel-/Marketingmethoden müssen ausgeschlossen bleiben.

Ob Google Labels auch bei diesen ausgeschlossenen Produkten sofort in der Versandkonfiguration anbietet, ist erst nach dem ausdrücklich genehmigten Import verifizierbar. Das ist kein Grund, vorzeitig die Auslieferung freizugeben. Falls die Labels nicht erscheinen: Einrichtung sperren und Diagnose klären.

## Tests

- **163/163 automatisierte Tests bestanden**, keine übersprungenen Tests. Darunter sechs vollständige Angebote, alle Ausschlüsse pro Produkt, korrekte Labels/Preise, unbekannte Katalogänderungen, fehlende Produktdaten, Länder-/Schaltermatrix, widersprüchliche Modi, Abwehr von Query-/Header-Umschaltungen, korrekte Fehler/HEAD/Methoden und lesende Lagerabfrage.
- **121 unabhängige Browser-XML-Prüfungen bestanden** für den Einrichtungsfeed: echter DOMParser, alle sechs Angebote und 54 Ausschlüsse, eindeutige IDs, korrekte Preise/Labels und gesperrter Normalfeed.
- **113 bestehende Merchant-XML-Prüfungen bestanden** für die bisherige Ausgabe.
- **323 Shop-Browserprüfungen bestanden**, sechs Bildschirmgrößen: bestehende Galerien, Navigation, Varianten, Warenkorb und Versandregeln unverändert.
- **11 lokale Cloudflare-Pages-Routenprüfungen bestanden**: beide dynamischen XML-Routen, abgeschaltete Ausgabe, HEAD/POST, bestehende Produktseiten/Zubehör und echte 404.
- Produktions-Build und Worker-Kompilierung erfolgreich.

Eine zuerst angesprochene ältere lokale Vorschau kannte die neue Route noch nicht. Die abschließenden Routenprüfungen wurden deshalb in einer frisch gestarteten Pages-Laufzeit ausgeführt und bestanden. Kein produktiver Routingfehler und kein Deployment.

Nachweise in diesem Ordner: `tests.txt`, `build.txt`, `xml-validation.json`, `shop-regression.json`, `pages-routing.json`, `import-policy.json`. **`fixture-only-setup.xml` enthält ausschließlich lokale Testbestände und darf nicht als echter Produktimport verwendet werden.** Kein offizieller Google-Import-/Diagnosetest und keine Behauptung einer Merchant-Center-Zulassung.

## Geänderte Dateien

- `server/merchant-setup-feed.js`: eigener geschützter Renderer, feste Ausschlüsse, Länder-/Modusprüfungen und read-only Endpunkt.
- `functions/google-merchant-setup-feed.xml.js`: neue Cloudflare-Pages-Function.
- `server/merchant-feed.js`: Normalfeed bei aktivem Einrichtungsmodus zusätzlich sperren.
- `scripts/build.mjs`: neue Route dynamisch registrieren; keine statische XML-Datei im Build.
- `.dev.vars.example`: neue deaktivierte Beispielvariablen.
- `scripts/preview-merchant-feed.mjs`: isolierte lokale Einrichtungsfixtures.
- `scripts/qa-merchant-setup-feed.mjs`, `scripts/qa-merchant-setup-routing.mjs`, `tests/merchant-setup-feed.test.js`: reproduzierbare Prüfungen.
- Dieser Bericht und lokale Testbelege.

Unverändert: Preise/Katalog, Checkout-/Zahlungsprozesse, Bestandslogik und Migrationen, Bestellmails, Produktbilder/-seiten und produktive Cloudflare-Konfiguration. Vorhandene unversionierte SEO-/Live-Berichte wurden nicht in diesen Arbeitsumfang aufgenommen.

## Konkrete Freigaben und spätere Reihenfolge

1. **Codeveröffentlichung separat freigeben:** diesen Feature-Branch nach erneutem Produktionsabgleich integrieren und deployen; zunächst alle neuen Einrichtungsschalter deaktiviert lassen. Beide Feed-Endpunkte müssen dann ohne Produktdaten gesperrt sein.
2. **Geschützte Bereitstellung und tatsächlichen Erstimport ausdrücklich freigeben:** Deutschland allein im Importdialog prüfen, anschließend nur `MERCHANT_SETUP_FEED_ENABLED=true` und `MERCHANT_SETUP_COUNTRY_CONFIRMED=DE` setzen. Die beiden bisherigen Feed-Schalter bleiben false. Endpunkt aus frischen maßgeblichen D1-Daten abrufen und vor Import alle sechs Angebote sowie neun Ausschlüsse je Angebot erneut prüfen. Keine Fixturedatei hochladen.
3. Datenquelle ausschließlich DE / Deutsch / Feedlabel DE anlegen; Datei-URL muss der **Einrichtungsendpunkt** sein. Keine zusätzliche automatische Quelle aktivieren. Erst nach erteilter Importfreigabe speichern/importieren; die im Assistenten notwendige Marketingauswahl darf die Ausschlüsse nicht ersetzen. Gespeicherte Zielländer und ausgeschlossene Marketingziele aller sechs Produkte unmittelbar nach Verarbeitung kontrollieren.
4. Sobald die Labels verfügbar sind, Stickerregel 1,10 € und Plate-Regel 6,19 € ohne irreführende Überschneidungen einrichten. Mischwarenkorbregel weiterhin separat überprüfen. Einrichtungsimport ist keine Versandfreigabe.
5. Falls der Setup-Endpunkt wieder deaktiviert wird, bleiben bereits importierte Google-Datensätze bestehen. Das Abschalten der URL allein löscht keine Produkte und ist kein Ersatz für die Ausschlüsse. Die Setup-Datenquelle nicht unbemerkt auf den Normalfeed umstellen.
6. **Spätere öffentliche Produktauslieferung benötigt eine weitere ausdrückliche Freigabe:** erst nach Versand-/Kontoprüfung über die Umstellung der Datenquelle und das bewusste Entfernen der Ausschlüsse entscheiden. Dieser Auftrag erteilt sie nicht.

**Aktueller Freigabestatus: zur technischen Prüfung vorbereitet, nicht veröffentlicht, nicht importiert, keine produktiven Schalter geändert.**
