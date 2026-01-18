/**
 * Implementación WS-Security minimal para SUNAT.
 * SUNAT beta es muy estricto y rechaza headers con:
 * - Timestamps
 * - wsu:Id en UsernameToken
 * - wsu:Created en UsernameToken
 * - Nonce
 *
 * Esta implementación genera exactamente lo mínimo requerido.
 */

const WSSE_NS = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd';
const PASSWORD_TYPE = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText';

export class SunatWSSecurity {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  toXML() {
    // Generar header WS-Security mínimo sin atributos extra
    return `<wsse:Security xmlns:wsse="${WSSE_NS}">` +
      `<wsse:UsernameToken>` +
      `<wsse:Username>${this._escapeXml(this.username)}</wsse:Username>` +
      `<wsse:Password Type="${PASSWORD_TYPE}">${this._escapeXml(this.password)}</wsse:Password>` +
      `</wsse:UsernameToken>` +
      `</wsse:Security>`;
  }

  _escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // node-soap llama addOptions y addHeaders
  addOptions(options) {
    return options;
  }

  addHeaders(headers) {
    return headers;
  }
}

export default SunatWSSecurity;
