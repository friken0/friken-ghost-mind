const status = document.getElementById('status');
const form = document.getElementById('unlock');
const code = document.getElementById('key');
const button = form.querySelector('button');
const keyPattern = /^[A-Za-z0-9_-]{43}$/;

async function openTransmission(fragment) {
  if (!keyPattern.test(fragment)) {
    status.textContent = 'Paste the full unlock code from the sender.';
    return;
  }
  button.disabled = true;
  status.textContent = 'Receiving and unlocking your transmission…';
  try {
    const rawKey = Uint8Array.from(atob(fragment.replace(/-/g, '+').replace(/_/g, '/') + '='), char => char.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
    rawKey.fill(0);
    const response = await fetch('transmission.bin', {credentials: 'omit', referrerPolicy: 'no-referrer'});
    if (!response.ok) throw Error('Transmission unavailable');
    const packet = new Uint8Array(await response.arrayBuffer());
    const decrypted = await crypto.subtle.decrypt({name: 'AES-GCM', iv: packet.subarray(0, 12)}, key, packet.subarray(12));
    const page = new TextDecoder('utf-8', {fatal: true}).decode(decrypted);
    history.replaceState(null, '', '#' + fragment);
    document.open();
    document.write(page);
    document.close();
  } catch {
    status.textContent = 'Could not unlock this transmission. Check the full link or paste the unlock code.';
    button.disabled = false;
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  void openTransmission(code.value.trim());
});
const fragment = location.hash.slice(1);
if (fragment) void openTransmission(fragment);
