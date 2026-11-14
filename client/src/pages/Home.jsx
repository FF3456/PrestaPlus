import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { homeFor } from '../components/ProtectedRoute.jsx';

const TEXTS = {
  es: {
    navHow: '¿Cómo funciona?',
    navReq: 'Requisitos',
    navFaq: 'Preguntas Frecuentes',
    heroTitle: 'Préstamos prendarios con seguimiento claro, de principio a fin.',
    heroSubtitle: 'Deja tu garantía en custodia, recibe dinero al instante y controla montos, intereses y fechas de vencimiento desde cualquier dispositivo.',
    btnStart: 'Solicitar un préstamo',
    btnLogin: 'Ya tengo cuenta',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    howItWorks: '¿Cómo funciona PRESTA+?',
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      {
        question: '¿Qué artículos puedo dejar como garantía?',
        answer: 'Aceptamos artículos en buen estado, como electrónicos, joyas, vehículos y herramientas. La disponibilidad depende de la evaluación del equipo.'
      },
      {
        question: '¿Cómo se determina el monto del préstamo?',
        answer: 'Un tasador revisa la información y el estado de tu garantía. La oferta y sus condiciones se muestran para que puedas revisarlas antes de continuar.'
      },
      {
        question: '¿Qué necesito para solicitar un préstamo?',
        answer: 'Debes ser mayor de 18 años, contar con una cédula vigente y proporcionar fotografías claras y datos que acrediten la propiedad de la garantía.'
      },
      {
        question: '¿Cómo recupero mi garantía?',
        answer: 'Puedes consultar el saldo y las condiciones de pago desde tu cuenta. Una vez liquidado el monto correspondiente, coordina el rescate de tu artículo.'
      }
    ],
    trust1: 'Sin filas ni burocracia',
    trust2: 'Bóveda y custodia 100% segura',
    trust3: 'Tasación transparente',
    steps: [
      {
        icon: '📱',
        title: '1. Registra tu garantía',
        desc: 'Describe tu bien, sube sus fotografías y recibe al instante un estimado de cuánto dinero puedes obtener.'
      },
      {
        icon: '🔍',
        title: '2. Un tasador la evalúa',
        desc: 'Nuestro personal confirma el valor de mercado, asigna la tasa preferencial y genera tu contrato digital.'
      },
      {
        icon: '🤝',
        title: '3. Recibe dinero y rescata',
        desc: 'Abona a capital, paga tus intereses o renuncia al plazo. Al liquidar el saldo, recuperas tu bien intacto.'
      }
    ],
    modalReqTitle: 'Requisitos para solicitar tu préstamo',
    modalReqSubtitle: 'Aceptamos una gran variedad de garantías prendarias en buen estado.',
    categoriesTitle: 'Prendas aceptadas:',
    categories: [
      { name: 'Electrónica', desc: 'Laptops, smartphones, tablets, consolas.' },
      { name: 'Joyas', desc: 'Oro 14K/18K, diamantes, relojes de alta gama.' },
      { name: 'Vehículos', desc: 'Automóviles, motocicletas (con documentación).' },
      { name: 'Herramientas', desc: 'Equipos eléctricos e industriales.' }
    ],
    docsTitle: 'Documentos requeridos:',
    docs: [
      'Cédula de Identidad (CI) vigente.',
      'Ser mayor de 18 años.',
      'Fotografías claras de la garantía.',
      'Demostrar propiedad del bien o número de serie/IMEI legible.'
    ],
    closeModal: 'Entendido, cerrar',
    footerTitle: 'PRESTA+ · Plataforma Inteligente de Préstamos Prendarios',
    contactsTitle: 'Contactos',
    contacts: [
      { name: 'Fidel Flores', email: 'fidel.flores@gmail.com' },
      { name: 'Alvaro Condori', email: 'alvaro.condori@gmail.com' },
      { name: 'Yamil Ramos', email: 'yamil.ramos@gmail.com' },
      { name: 'Mijael Vega', email: 'mijael.vega@gmail.com' }
    ],
    docent: 'Ayuda: Ing. Victor Hugo Sarzuri Flores',
    university: 'Universidad Adventista de Bolivia · Ingeniería de Sistemas',
    rights: 'Todos los derechos reservados.'
  },
  en: {
    navHow: 'How it works',
    navReq: 'Requirements',
    navFaq: 'FAQ',
    heroTitle: 'Collateral loans with clear tracking from start to finish.',
    heroSubtitle: 'Leave your collateral in custody, receive cash instantly, and manage rates, interest, and due dates directly from your phone or PC.',
    btnStart: 'Apply for a loan',
    btnLogin: 'I have an account',
    login: 'Log in',
    register: 'Sign up',
    howItWorks: 'How PRESTA+ works?',
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        question: 'What items can I use as collateral?',
        answer: 'We accept items in good condition, such as electronics, jewelry, vehicles, and tools. Acceptance depends on the team’s appraisal.'
      },
      {
        question: 'How is the loan amount determined?',
        answer: 'An appraiser reviews the information and condition of your item. The offer and its terms are shown for you to review before proceeding.'
      },
      {
        question: 'What do I need to apply for a loan?',
        answer: 'You must be at least 18, have a valid ID, and provide clear photos and information showing ownership of the collateral.'
      },
      {
        question: 'How do I get my collateral back?',
        answer: 'You can check the balance and payment terms in your account. After settling the applicable amount, arrange to redeem your item.'
      }
    ],
    trust1: 'No paperwork or lines',
    trust2: '100% Secure vault custody',
    trust3: 'Transparent appraisal',
    steps: [
      {
        icon: '📱',
        title: '1. Register collateral',
        desc: 'Describe your item, upload photos, and get an immediate estimate of available funds.'
      },
      {
        icon: '🔍',
        title: '2. Expert appraisal',
        desc: 'Our staff verifies the market value, sets the rate, and approves your digital contract.'
      },
      {
        icon: '🤝',
        title: '3. Receive funds & redeem',
        desc: 'Pay interest, make capital contributions, or renew. Retrieve your item once fully paid.'
      }
    ],
    modalReqTitle: 'Requirements to apply for a loan',
    modalReqSubtitle: 'We accept a wide variety of items in good working condition.',
    categoriesTitle: 'Accepted items:',
    categories: [
      { name: 'Electronics', desc: 'Laptops, smartphones, tablets, consoles.' },
      { name: 'Jewelry', desc: '14K/18K Gold, diamonds, luxury watches.' },
      { name: 'Vehicles', desc: 'Cars, motorcycles (with clear title).' },
      { name: 'Tools', desc: 'Power and industrial tools.' }
    ],
    docsTitle: 'Required documentation:',
    docs: [
      'Valid Government ID.',
      'Must be 18 years or older.',
      'Clear photos of the item.',
      'Proof of ownership or legible serial/IMEI number.'
    ],
    closeModal: 'Understood, close',
    footerTitle: 'PRESTA+ · Smart Collateral Loan Platform',
    contactsTitle: 'Contacts',
    contacts: [
      { name: 'Fidel Flores', email: 'fidel.flores@gmail.com' },
      { name: 'Alvaro Condori', email: 'alvaro.condori@gmail.com' },
      { name: 'Yamil Ramos', email: 'yamil.ramos@gmail.com' },
      { name: 'Mijael Vega', email: 'mijael.vega@gmail.com' }
    ],
    docent: 'Help: Ing. Victor Hugo Sarzuri Flores',
    university: 'Universidad Adventista de Bolivia · Systems Engineering',
    rights: 'All rights reserved.'
  }
};

export default function Home() {
  const { user } = useAuth();
  const [lang, setLang] = useState('es');
  const [showReqModal, setShowReqModal] = useState(false);
  const t = TEXTS[lang];

  if (user) return <Navigate to={homeFor(user)} replace />;

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-navy-900">
      {/* 1. Header con Navegación y Selector de Idioma */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="inline-flex items-center justify-center text-xl font-bold tracking-[0.12em] text-white">
            PRESTA<span className="text-accent-500">+</span>
          </Link>

          {/* Menú de Navegación Central */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button 
              onClick={() => scrollToSection('como-funciona')}
              className="transition-colors hover:text-accent-500"
            >
              {t.navHow}
            </button>
            <button 
              onClick={() => setShowReqModal(true)}
              className="transition-colors hover:text-accent-500"
            >
              {t.navReq}
            </button>
            <button 
              onClick={() => scrollToSection('preguntas-frecuentes')}
              className="transition-colors hover:text-accent-500"
            >
              {t.navFaq}
            </button>
          </nav>

          {/* Selector de idioma y Acceso */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-white/20 bg-white p-1 text-xs font-semibold shadow-sm">
              <button
                onClick={() => setLang('es')}
                className={`rounded-md px-2 py-1 shadow-sm transition-all hover:shadow-md ${lang === 'es' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:text-brand-600'}`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`rounded-md px-2 py-1 shadow-sm transition-all hover:shadow-md ${lang === 'en' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:text-brand-600'}`}
              >
                EN
              </button>
            </div>

            <Link to="/login" className="btn-secondary hidden sm:inline-flex">{t.login}</Link>
            <Link to="/registro" className="btn-primary">{t.register}</Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section con logotipo a la derecha */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 py-12 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            
            {/* Lado Izquierdo: Propuesta de valor */}
            <div className="lg:col-span-7">
              <h1 className="!text-3xl !leading-tight text-white sm:!text-5xl">
                {t.heroTitle}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                {t.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/registro" className="btn-primary !px-6 !py-3 text-base shadow-md">
                  {t.btnStart}
                </Link>
                <Link to="/login" className="btn-secondary !px-6 !py-3 text-base">
                  {t.btnLogin}
                </Link>
              </div>

              {/* Badges de Confianza */}
              <div className="mt-8 flex flex-wrap gap-4 border-t border-white/20 pt-6 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold"><span className="text-accent-500">✓</span> {t.trust1}</span>
                <span className="flex items-center gap-1 font-semibold"><span className="text-accent-500">✓</span> {t.trust2}</span>
                <span className="flex items-center gap-1 font-semibold"><span className="text-accent-500">✓</span> {t.trust3}</span>
              </div>
            </div>

            {/* Lado Derecho: Identidad visual de PRESTA+ */}
            <div className="lg:col-span-5">
              <div className="flex min-h-[22rem] items-center justify-center p-4">
                <img
                  src="/presta-logo.png"
                  alt="PRESTA+ — Préstamos con prenda"
                  className="h-auto w-full max-w-[320px] object-contain"
                />
              </div>
            </div>

          </div>
        </section>

        {/* 3. Sección "¿Cómo funciona?" */}
        <section id="como-funciona" className="border-t border-slate-200 bg-paper py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="mb-8 text-center text-2xl sm:text-3xl font-bold text-brand-600">{t.howItWorks}</h2>
            <ol className="grid gap-6 md:grid-cols-3">
              {t.steps.map((step) => (
                <li key={step.title} className="card flex flex-col justify-between p-6 transition-all hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md">
                  <div>
                    <span className="mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-2xl" aria-hidden="true">
                      {step.icon}
                    </span>
                    <h3 className="text-lg font-semibold text-brand-600">{step.title}</h3>
                    <p className="mt-2 text-ink-600 leading-relaxed text-sm">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="preguntas-frecuentes" className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-4xl px-5">
            <h2 className="mb-8 text-center text-2xl font-bold text-brand-600 sm:text-3xl">{t.faqTitle}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {t.faqs.map(({ question, answer }) => (
                <div key={question} className="border border-slate-200 bg-paper p-5">
                  <dt className="font-semibold text-ink-900">{question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-600">{answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      {/* 4. Modal de Requisitos */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between border-b border-brand-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-brand-600">{t.modalReqTitle}</h3>
                <p className="text-xs text-ink-600">{t.modalReqSubtitle}</p>
              </div>
              <button 
                onClick={() => setShowReqModal(false)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-ink-600 shadow-sm transition-all hover:border-brand-500 hover:text-brand-600 hover:shadow-md"
                aria-label={t.closeModal}
              >
                ✕
              </button>
            </div>

            {/* Categorías Aceptadas */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-brand-600 tracking-wider">{t.categoriesTitle}</p>
              <div className="grid grid-cols-2 gap-2">
                {t.categories.map((c) => (
                  <div key={c.name} className="rounded-lg bg-paper p-2.5 text-xs">
                    <p className="font-semibold text-ink-900">{c.name}</p>
                    <p className="text-ink-600 text-[11px]">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Requisitos Documentales */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-brand-600 tracking-wider">{t.docsTitle}</p>
              <ul className="list-disc space-y-1 pl-4 text-xs text-ink-600">
                {t.docs.map((doc, i) => (
                  <li key={i}>{doc}</li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => setShowReqModal(false)}
              className="btn-primary w-full"
            >
              {t.closeModal}
            </button>
          </div>
        </div>
      )}

      {/* 5. Pie de Página con contactos y créditos */}
      <footer className="border-t border-white/10 bg-navy-900 text-white">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <img src="/presta-logo.png" alt="PRESTA+ — Préstamos con prenda" className="h-auto w-28" />
              <p className="mt-2 text-xs text-white/80">{t.university}</p>
              <p className="mt-1 text-xs text-white/80">{t.docent}</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t.contactsTitle}</p>
              <ul className="grid grid-cols-1 gap-1.5 text-xs text-white/85 sm:grid-cols-2">
                {t.contacts.map(({ name, email }) => (
                  <li key={email}>
                    <a className="transition-colors hover:text-accent-500" href={`mailto:${email}`}>
                      {name}: {email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-white/20 pt-4 text-center text-xs text-white/70">
            © 2026 PRESTA+ · {t.rights}
          </div>
        </div>
      </footer>
    </div>
  );
}