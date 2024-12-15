import m from 'mithril';
import 'material-icons/iconfont/filled.css';
import 'materialize-css/dist/css/materialize.min.css';
import 'materialize-css/dist/js/materialize.min.js';
import './css/style.css';
import { routingSvc } from './services/routing-service';
import { i18n } from './services';

document.documentElement.setAttribute('lang', 'en');

window.onbeforeunload = (e) => {
  e.preventDefault(); // This is necessary for older browsers
};

i18n.addOnChangeListener((locale: string) => {
  console.log(`Language loaded: ${locale}`);
  routingSvc.init();
  m.route(document.body, routingSvc.defaultRoute, routingSvc.routingTable());
});
i18n.init(
  {
    en: { name: 'English', fqn: 'en-UK', default: true },
    nl: { name: 'Nederlands', fqn: 'nl-NL' },
  },
  'en'
);
