import React from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Bot, 
  Truck, 
  CloudSunRain, 
  Scale 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import FeatureCard from './FeatureCard';

export default function FeaturesSection() {
  const { t } = useLanguage();

  const featureList = [
    {
      icon: Calculator,
      title: t('features.harvestTitle'),
      desc: t('features.harvestDesc'),
      link: '/harvest',
      badge: 'ISSUE-07',
      color: 'text-primary bg-primary-50 border-primary/20',
    },
    {
      icon: TrendingUp,
      title: t('features.marketsTitle'),
      desc: t('features.marketsDesc'),
      link: '/markets',
      badge: 'ISSUE-06',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      icon: Bot,
      title: t('features.mitraTitle'),
      desc: t('features.mitraDesc'),
      link: '/chat',
      badge: 'ISSUE-09',
      color: 'text-primary-dark bg-secondary border-border',
    },
    {
      icon: Truck,
      title: t('features.transportTitle'),
      desc: t('features.transportDesc'),
      link: '/transport',
      badge: 'ISSUE-08',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      icon: CloudSunRain,
      title: t('features.weatherTitle'),
      desc: t('features.weatherDesc'),
      link: '/weather',
      badge: 'Weather API',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      icon: Scale,
      title: t('features.decisionSupportTitle'),
      desc: t('features.decisionSupportDesc'),
      link: '/dashboard',
      badge: 'Core Engine',
      color: 'text-teal-700 bg-teal-50 border-teal-200',
    },
  ];

  return (
    <section 
      id="features" 
      className="py-16 sm:py-24"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="badge-tag bg-secondary text-primary-dark border border-border">
            {t('features.sectionTag')}
          </span>
          <h2 id="features-heading" className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
            {t('features.title')}
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((item, idx) => (
            <FeatureCard
              key={idx}
              icon={item.icon}
              title={item.title}
              desc={item.desc}
              link={item.link}
              badge={item.badge}
              color={item.color}
              exploreText={t('features.exploreFeature')}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
