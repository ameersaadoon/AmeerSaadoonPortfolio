const fs = require('fs');
const path = require('path');

const outputRoot = path.resolve(process.argv[2] === '--output' ? process.argv[3] || '.' : '.');
const templatePath = path.join(outputRoot, 'page-template.html');
const contentPath = path.join(outputRoot, 'public', 'content.json');
const template = fs.readFileSync(templatePath, 'utf8');
const translations = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
const publicOrigin = 'https://ameersaadoon.github.io/AmeerSaadoonPortfolio';
const logoUrl = `${publicOrigin}/assets/ask-mark.svg`;
const profileDescriptions = {
  en: 'Ameer Saadoon Khudhair is a Baghdad-based banking technology professional and Technical Consultant with more than five years of experience in IT application support, core banking, AML and KYC systems, SafeWatch administration, payment services, production operations, testing, integrations, data investigations, and post-go-live delivery. His experience includes iMAL Core Banking, Oracle and PL/SQL, SQL Server, Linux, UAT and SIT, ISO 8583, EMV, SOAP UI, Postman, and Payment Simulator.',
  ar: 'أمير سعدون خضير متخصص في التكنولوجيا المصرفية واستشاري تقني من بغداد، يمتلك أكثر من خمس سنوات من الخبرة في دعم تطبيقات تقنية المعلومات والأنظمة المصرفية الأساسية وأنظمة مكافحة غسل الأموال واعرف عميلك وإدارة SafeWatch وخدمات الدفع وعمليات الإنتاج والاختبار والتكامل والتحقيقات المتعلقة بالبيانات وما بعد الإطلاق. تشمل خبرته iMAL Core Banking وOracle وPL/SQL وSQL Server وLinux وUAT وSIT وISO 8583 وEMV وSOAP UI وPostman وPayment Simulator.'
};

const readContent = (source, key) => key.split('.').reduce((value, part) => value?.[part], source);
const escapeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const renderList = (items = []) => items.map((item) => `<li>${item}</li>`).join('');
const buildTimelineMarkup = (content) => (Array.isArray(content?.experience?.items) ? content.experience.items : []).map((item) => `
  <article class="timeline-item">
    <div class="timeline-marker"><span></span></div>
    <div class="timeline-date">${item.date}</div>
    <div class="timeline-body"><h3>${item.title}</h3><p class="timeline-place">${item.place}</p>${item.summary ? `<p>${item.summary}</p>` : ''}${item.points ? `<ul class="timeline-points">${renderList(item.points)}</ul>` : ''}${item.subTitle ? `<h4>${item.subTitle}</h4><ul class="timeline-points">${renderList(item.subPoints)}</ul>` : ''}</div>
  </article>`).join('');

function replaceTranslations(html, content) {
  html = html.replace(/<([a-z0-9]+)([^>]*data-i18n="([^"]+)"[^>]*)>[\s\S]*?<\/\1>/gi, (match, tag, attributes, key) => {
    const value = readContent(content, key);
    return value === undefined ? match : `<${tag}${attributes}>${value}</${tag}>`;
  });
  return html.replace(/data-i18n-aria-label="([^"]+)"/g, (match, key) => {
    const value = readContent(content, key);
    return value === undefined ? match : `aria-label="${value}"`;
  });
}

function personSchema(language, canonicalUrl) {
  const pageName = translations[language].meta.title;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageName,
        inLanguage: language,
        mainEntity: { '@id': `${publicOrigin}/#person` }
      },
      {
        '@type': 'Person',
        '@id': `${publicOrigin}/#person`,
        name: 'Ameer Saadoon Khudhair',
        alternateName: [
          'Ameer Saadoun Khudhair',
          'Ameer Saadoon Khudair',
          'Ameer Saadoun Khudair',
          'Ameer Saddoon Khudhair',
          'Ameer Saddoon Khudair',
          'Ameer Saddoun Khudhair',
          'Ameer S. Khudhair',
          'أمير سعدون خضير'
        ],
        url: publicOrigin,
        image: logoUrl,
        jobTitle: 'Technical Consultant and IT Application Support Specialist',
        description: profileDescriptions[language],
        email: 'ameer.saadoon97@gmail.com',
        telephone: '+9647711613558',
        worksFor: {
          '@type': 'Organization',
          name: 'Guardia Systems SAL'
        },
        alumniOf: {
          '@type': 'CollegeOrUniversity',
          name: 'University of Al-Nahrain'
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Baghdad',
          addressCountry: 'IQ'
        },
        knowsAbout: [
          'IT application support',
          'Core banking',
          'AML and KYC',
          'SafeWatch',
          'iMAL Core Banking',
          'Payment systems',
          'Oracle and PL/SQL',
          'SQL Server',
          'Linux',
          'UAT and SIT testing'
        ],
        sameAs: [
          'https://www.linkedin.com/in/ameer-saadoon97',
          'https://github.com/ameersaadoon/AmeerSaadoonPortfolio'
        ]
      }
    ]
  };
}

function renderPage(language, prefix, canonicalUrl) {
  const content = translations[language];
  const englishUrl = '?lang=en';
  const arabicUrl = '?lang=ar';
  let html = template
    .replace('<html lang="en" dir="ltr">', `<html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${content.meta.title}</title>`)
    .replace(/(<meta name="description"[^>]*content=")[^"]*("[^>]*>)/, `$1${content.meta.description}$2`)
    .replace(/(<meta property="og:title"[^>]*content=")[^"]*("[^>]*>)/, `$1${content.meta.title}$2`)
    .replace(/(<meta property="og:description"[^>]*content=")[^"]*("[^>]*>)/, `$1${content.meta.description}$2`)
    .replace(/(<meta name="twitter:title"[^>]*content=")[^"]*("[^>]*>)/, `$1${content.meta.title}$2`)
    .replace(/(<meta name="twitter:description"[^>]*content=")[^"]*("[^>]*>)/, `$1${content.meta.description}$2`)
    .replace(/__CANONICAL_URL__/g, canonicalUrl)
    .replace(/__OG_URL__/g, canonicalUrl)
    .replace(/__OG_LOCALE__/g, language === 'ar' ? 'ar_IQ' : 'en_US')
    .replace(/__PERSON_SCHEMA__/g, escapeJson(personSchema(language, canonicalUrl)))
    .replace(/href="\/?\?lang=en"/g, `href="${englishUrl}"`)
    .replace(/href="\/?\?lang=ar"/g, `href="${arabicUrl}"`)
    .replace(/href="assets\//g, `href="${prefix}assets/`)
    .replace(/src="assets\//g, `src="${prefix}assets/`)
    .replace(/href="styles\.css"/g, `href="${prefix}styles.css"`)
    .replace(/src="script\.js"/g, `src="${prefix}script.js"`)
    .replace(/<div class="timeline reveal reveal-delay" id="timeline" data-render="experience"><\/div>/, `<div class="timeline reveal reveal-delay" id="timeline" data-render="experience"><!-- TIMELINE_CONTENT -->${buildTimelineMarkup(content)}<!-- /TIMELINE_CONTENT --></div>`);

  html = replaceTranslations(html, content)
    .replace(/<link rel="alternate" hreflang="en" href="[^"]*" \/>/, `<link rel="alternate" hreflang="en" href="${publicOrigin}/?lang=en" />`)
    .replace(/<link rel="alternate" hreflang="ar" href="[^"]*" \/>/, `<link rel="alternate" hreflang="ar" href="${publicOrigin}/?lang=ar" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href="[^"]*" \/>/, `<link rel="alternate" hreflang="x-default" href="${publicOrigin}/" />`)
    .replace(/aria-label="[^"]*"\s+aria-label="/g, 'aria-label="');
  return html;
}

const rootHtml = renderPage('en', '', `${publicOrigin}/?lang=en`);
fs.writeFileSync(path.join(outputRoot, 'index.html'), rootHtml);
console.log(`Generated the single bilingual page in ${outputRoot}`);
