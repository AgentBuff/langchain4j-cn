import clsx from 'clsx';
import { translate } from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
    {
        title: translate({
            id: 'homepage.features.easy.title',
            message: 'Easy interaction with LLMs and Vector Stores',
        }),
        Svg: require('@site/static/img/llm-logos.svg').default,
        description: translate({
            id: 'homepage.features.easy.description',
            message: 'All major commercial and open-source LLMs and Vector Stores are easily accessible through a unified API, enabling you to build chatbots, assistants and more.',
        }),
    },
    {
        title: translate({
            id: 'homepage.features.java.title',
            message: 'Tailored for Java',
        }),
        Svg: require('@site/static/img/framework-logos.svg').default,
        description: translate({
            id: 'homepage.features.java.description',
            message: 'Smooth integration into your Java applications is made possible thanks to Quarkus, Spring Boot and Helidon integrations. There is two-way integration between LLMs and Java: you can call LLMs from Java and allow LLMs to call your Java code in return.',
        }),
    },
    {
        title: translate({
            id: 'homepage.features.toolbox.title',
            message: 'Agents, Tools, RAG',
        }),
        Svg: require('@site/static/img/functionality-logos.svg').default,
        description: translate({
            id: 'homepage.features.toolbox.description',
            message: 'Our extensive toolbox provides a wide range of tools for common LLM operations, from low-level prompt templating, chat memory management, and output parsing, to high-level patterns like Agents and RAG.',
        }),
    }
];

function Feature({Svg, title, description}) {
    return (
        <div
            className={clsx(
                'col col--4',
                styles.featureCard
            )}
        >
            <div className='card shadow--md hover:shadow--lg transition-all duration-200 h-full'>
                <div className='card__body text--center'>
                    <Svg className={styles.featureSvg} role='img' />
                    <Heading as='h3' className='margin-top--sm'>
                        {title}
                    </Heading>
                    <p className='margin-top--sm'>{description}</p>
                </div>
            </div>
        </div>
    );
}

export default function HomepageFeatures() {
    return (
        <section className={clsx(styles.features, 'padding-vert--xl')}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
