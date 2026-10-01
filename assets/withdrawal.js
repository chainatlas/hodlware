'use strict';
(() => {
  const form = document.getElementById('withdrawal-form');
  if (!form) return;
  const status = document.getElementById('withdrawal-status');

  /* TODO BEFORE LIVE LAUNCH — server integration is deliberately NOT implemented.
   * Connect POST /api/withdrawals (or the selected production endpoint).
   * Accept {name, contractId, email}; validate and limit fields server-side.
   * Record the withdrawal itself, original declaration, unique confirmation ID,
   * authoritative server UTC receivedAt, and delivery state durably before success.
   * Send the customer a confirmation on a durable medium (email) containing the
   * declaration, contract identification, date/time and confirmation ID. Retry failed
   * mail delivery; do not discard an already received withdrawal on a mail failure.
   * Protect the endpoint against abuse; support idempotency for double submissions.
   * Return confirmed server receipt data, never a client-generated success receipt.
   * Render success / downloadable receipt only after a validated server response.
   * Replace the availability notice and form explanation only after end-to-end tests
   * for storage, email, timezones, duplicate submissions and network/server failures.
   * Do not store customers' withdrawal data in localStorage or log it to the console.
   */
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    // Preview timestamp only: not a server receipt and not durable documentation.
    const attemptedAt = new Date();
    const time = document.createElement('time');
    time.dateTime = attemptedAt.toISOString();
    time.textContent = new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'long', timeStyle: 'long', timeZone: 'Europe/Berlin'
    }).format(attemptedAt);
    status.replaceChildren(
      document.createTextNode('Nicht übermittelt. Die elektronische Widerrufsfunktion ist noch nicht freigeschaltet. Es wurde kein Widerruf gespeichert und keine Eingangsbestätigung versendet. Zeitpunkt dieses lokalen Versuchs: '),
      time,
      document.createTextNode('. Bitte nutze die E-Mail-Adresse oder Postanschrift in der Widerrufsbelehrung.')
    );
    status.focus();
  });
})();