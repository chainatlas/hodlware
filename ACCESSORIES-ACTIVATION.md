# Produktive Zubehöraktivierung – Ausgangsprüfung und Freigabe

Der Geschäftsführer hat die produktive Aktivierung des freigegebenen Standes `909369ce9b7965d3d778887a036c0665ae79d1da` einschließlich Preisanlage, additiver D1-Migration, Startbestand, Veröffentlichung und Verkauf ausdrücklich beauftragt. Die Versandart und der Kundenpreis von 1,10 EUR mit Basis-Sendungsverfolgung sind verbindlich bestätigt. Frühere Freigabevorbehalte in der vorbereitenden Checkliste sind damit für diesen Auftrag erfüllt. Echte kostenpflichtige Testbestellungen bleiben ausgeschlossen.

## Nachgewiesener Ausgangszustand

- GitHub main und Cloudflare-Produktion: `160fc83360b601f9afd224ae9c12557b9382f045`.
- Bestehendes Cloudflare-Deployment: `a799fd44-00d8-4bb0-98b6-6f753efec425`.
- GitHub-Backup-Tag: `backup/pre-accessories-20261031` zeigt auf diesen Commit.
- D1-Time-Travel-Bookmark vor Änderungen: `00000126-00000004-00005115-f9a1d175989c9362c3ee4a85f3edb955`.
- Bestehender Plate-Inventarwert: 24, davon eine bezahlte Einheit; 23 verfügbar. Kein Plate-Bestand wurde geändert.
- Vorhandene Stripe-LIVE-Preise für beide Plates: unverändert 7900 Cent.
- Vor Migration keine Zubehör-Bestandstabelle/Reservierungen, kein VOID-Stripe-Produkt.

## Ausgeführte Vorbereitung und gesperrte Veröffentlichung

1. Vier eindeutig benannte Paketprodukte mit deterministischen Produkt-IDs angelegt; Paketmengen sind in Namen und Metadaten erkennbar. Kein vorhandener Artikel wurde dupliziert. Stripe führt keine separaten Bestände; alle Varianten reservieren weiter denselben D1-Schlüssel `void-stickers`.
2. Die vier neuen aktiven einmaligen EUR-Preise verifiziert:

| Paket | Cent | LIVE-Preis-ID |
|---|---:|---|
| 1 | 99 | `price_1UWiLGIPPGFjbWPMRiJc4Vlk` |
| 5 | 349 | `price_1UWiLNIPPGFjbWPMBXEhpzK7` |
| 10 | 599 | `price_1UWiLRIPPGFjbWPMrmh3Zpbl` |
| 25 | 1199 | `price_1UWiLTIPPGFjbWPMkS4NU6Kz` |

3. Preiskennungen und zunächst deaktivierte Flags in Cloudflare ergänzt. Der merge-erhaltende Updateweg wurde anhand des offiziellen Wrangler-Quellcodes und der Cloudflare-API-Dokumentation geprüft. Vorhandene Variablennamen, Plaintextwerte, Secret-Typen und D1-Binding sind danach unverändert geprüft. Keine bestehenden Secrets wurden geschrieben.
4. Ausschließlich `migrations/0004_accessory_inventory.sql` produktiv ausgeführt. Tabelle, Index und beide Schutztrigger vorhanden; bestehende Tabellen/Bestellungen unverändert.
5. Unberührten Nullbestand ohne Reservierungshistorie geprüft und `operations/initialize-void-stock.sql` einmal kontrolliert ausgeführt: `void-stickers=1800`, keine Paket-Bestandszeilen. 200 Reserve bleiben ausgeschlossen.
6. Mail-Worker mit korrektem D1, vorhandenem Resend-Secret und bestehendem Minuten-Cron geprüft. Mail-Outbox ohne Rückstand: 11 `sent`. Keine neuen Mails ausgelöst.
7. Bestehenden aktiven Stripe-Webhooks die vier erforderlichen Events bestätigt; Endpoint `/api/stripe-webhook` und Secret unverändert.
8. 129 automatisierte Tests und Produktions-Build erneut bestanden. Release `d9b739c00f32f0a000b8ed2911b22e701c1d7c19` per Fast-Forward in GitHub main integriert. Bestehender Cloudflare-GitHub-Workflow hat Deployment `26e27595-47d1-4937-a96f-56d8486a8420` erfolgreich veröffentlicht.
9. Öffentliche Desktop-/Mobilprüfung dieses noch gesperrten Deployments erfolgreich: `/zubehoer` HTTP 200, drei Originalbilder, vier Paketvarianten, Checkout-Konfiguration bereit, Zubehörbutton deaktiviert. Startseite weiterhin zwei Plates, keine Plate-Upsells.

## Aktivierungscommit und anschließende Verifikation

Dieser Commit setzt ausschließlich die drei Zubehör-Produktionsschalter in `wrangler.toml` auf `true`; die Vorschau-Schalter bleiben `false`. Der GitHub-Workflow muss diesen Stand erst erfolgreich produktiv veröffentlichen, bevor die Aktivierung als abgeschlossen gilt. Der finale Produktionscommit, Deploymentstatus und öffentliche Checkout-Nachweise werden nach der tatsächlichen Verifikation im Abschlussbericht dokumentiert. Kein Erfolg wird aus dem Commit allein abgeleitet.

Die öffentliche Checkout-Prüfung darf unbezahlte Sessions anlegen, aber keine Zahlung absenden. Eigene Testreservierungen müssen kontrolliert durch bestätigten Ablauf freigegeben werden. Eine neue echte Zahlung und der damit verbundene reale Mailversand werden ohne gesonderte Freigabe nicht ausgelöst; diese Grenze bleibt im Abschlussbericht sichtbar.

## Fehlerfall

Neue Zubehörkäufe zuerst mit `ACCESSORIES_ENABLED=false` sperren und diesen Zustand wirksam veröffentlichen. Aktuellen Zubehörkatalog, D1, Stripe-/Webhook-Secrets und Mail-Worker zur Verarbeitung bereits begonnener Bestellungen behalten. Nicht ungeprüft auf den alten Code ohne Zubehör zurückrollen und keinen alten D1-Snapshot über neue Bestellungen schreiben. Bestände niemals pauschal auf 1800 zurücksetzen. Details: `ACCESSORIES-LIVE-CHECKLIST.md`, Abschnitt 7.

Technische Detailnachweise einschließlich geschwärzter Produktionskonfiguration und D1-Prüfergebnissen liegen lokal im ignorierten Ordner `.cache/live-activation/`. Dort werden keine Secret-Werte ausgegeben. Diese Versionsdatei enthält keine Zugangsdaten.
