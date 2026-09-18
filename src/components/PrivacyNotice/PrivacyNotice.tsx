'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { privacyCopy, type PrivacyLocale } from '../../content/privacy';
import './PrivacyNotice.css';

const PrivacyNotice: React.FC = () => {
    const [locale, setLocale] = useState<PrivacyLocale>('it');
    const copy = privacyCopy[locale];

    return (
        <main className="privacy-page" lang={locale}>
            <div className="privacy-shell">
                <p className="privacy-kicker">Starmonitor</p>
                <h1 className="privacy-title">{copy.documentTitle}</h1>
                <p className="privacy-legal-ref">{copy.legalRef}</p>
                <p className="privacy-updated">
                    {copy.lastUpdatedLabel}: {copy.lastUpdatedValue}
                </p>

                <div className="privacy-toolbar">
                    <div className="privacy-lang" role="group" aria-label={copy.switchLabel}>
                        <button
                            type="button"
                            className={`privacy-lang-btn${locale === 'it' ? ' is-active' : ''}`}
                            aria-pressed={locale === 'it'}
                            onClick={() => setLocale('it')}
                        >
                            IT
                        </button>
                        <button
                            type="button"
                            className={`privacy-lang-btn${locale === 'en' ? ' is-active' : ''}`}
                            aria-pressed={locale === 'en'}
                            onClick={() => setLocale('en')}
                        >
                            EN
                        </button>
                    </div>
                    <Link href="/" className="privacy-back">
                        {copy.backToTracker}
                    </Link>
                </div>

                {copy.sections.map((section) => (
                    <section key={section.title} className="privacy-section">
                        <h2>{section.title}</h2>
                        {section.paragraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                        {section.bullets && (
                            <ul>
                                {section.bullets.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}
                        {section.closing?.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                        {section.links && (
                            <ul className="privacy-links">
                                {section.links.map((link) => (
                                    <li key={link.href}>
                                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </div>
        </main>
    );
};

export default PrivacyNotice;
