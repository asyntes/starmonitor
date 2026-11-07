'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { privacyContent, type PrivacyLocale } from '../../content/privacy';
import './PrivacyNotice.css';

const LINK_PATTERN =
    /(https?:\/\/[^\s)]+|www\.garanteprivacy\.it|asyntes\.com|celestrak\.org)/g;

function LinkedText({ text }: { text: string }) {
    const parts = text.split(LINK_PATTERN);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('http://') || part.startsWith('https://')) {
                    return (
                        <a
                            key={`${part}-${index}`}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {part}
                        </a>
                    );
                }

                if (part === 'www.garanteprivacy.it') {
                    return (
                        <a
                            key={`${part}-${index}`}
                            href="https://www.garanteprivacy.it"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {part}
                        </a>
                    );
                }

                if (part === 'asyntes.com') {
                    return (
                        <a
                            key={`${part}-${index}`}
                            href="https://asyntes.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {part}
                        </a>
                    );
                }

                if (part === 'celestrak.org') {
                    return (
                        <a
                            key={`${part}-${index}`}
                            href="https://celestrak.org"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {part}
                        </a>
                    );
                }

                return <span key={`${part}-${index}`}>{part}</span>;
            })}
        </>
    );
}

const PrivacyNotice: React.FC = () => {
    const [language, setLanguage] = useState<PrivacyLocale>('en');
    const copy = privacyContent[language];

    useEffect(() => {
        if (navigator.language.toLowerCase().startsWith('it')) {
            setLanguage('it');
        }
    }, []);

    return (
        <main lang={language} className="privacy-page">
            <div className="privacy-shell">
                <div className="privacy-toolbar">
                    <Link href="/" className="privacy-back">
                        {copy.back}
                    </Link>
                    <div
                        className="privacy-lang"
                        role="group"
                        aria-label={language === 'it' ? 'Lingua' : 'Language'}
                    >
                        <button
                            type="button"
                            className={`privacy-lang-btn${language === 'it' ? ' is-active' : ''}`}
                            aria-pressed={language === 'it'}
                            onClick={() => setLanguage('it')}
                        >
                            IT
                        </button>
                        <span className="privacy-lang-sep" aria-hidden="true">
                            /
                        </span>
                        <button
                            type="button"
                            className={`privacy-lang-btn${language === 'en' ? ' is-active' : ''}`}
                            aria-pressed={language === 'en'}
                            onClick={() => setLanguage('en')}
                        >
                            EN
                        </button>
                    </div>
                </div>

                <h1 className="privacy-title">{copy.title}</h1>
                <p className="privacy-updated">{copy.updated}</p>
                <p className="privacy-intro">
                    <LinkedText text={copy.intro} />
                </p>

                {copy.sections.map((section) => (
                    <section key={section.title} className="privacy-section">
                        <h2>{section.title}</h2>
                        {section.paragraphs?.map((paragraph) => (
                            <p key={paragraph}>
                                <LinkedText text={paragraph} />
                            </p>
                        ))}
                        {section.items && section.items.length > 0 && (
                            <ul>
                                {section.items.map((item) => (
                                    <li key={item}>
                                        <LinkedText text={item} />
                                    </li>
                                ))}
                            </ul>
                        )}
                        {section.closing?.map((paragraph) => (
                            <p key={paragraph} className="privacy-closing">
                                <LinkedText text={paragraph} />
                            </p>
                        ))}
                    </section>
                ))}
            </div>
        </main>
    );
};

export default PrivacyNotice;
