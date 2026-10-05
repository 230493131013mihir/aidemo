import React from 'react';
import { 
  FileText, 
  Search, 
  Calculator, 
  Bot, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkflowSection() {
  const { t } = useLanguage();

  const steps = [
    {
      number: '01',
      icon: FileText,
      title: t('workflow.step1Title'),
      desc: t('workflow.step1Desc'),
    },
    {
      number: '02',
      icon: Search,
      title: t('workflow.step2Title'),
      desc: t('workflow.step2Desc'),
    },
    {
      number: '03',
      icon: Calculator,
      title: t('workflow.step3Title'),
      desc: t('workflow.step3Desc'),
    },
    {
      number: '04',
      icon: Bot,
      title: t('workflow.step4Title'),
      desc: t('workflow.step4Desc'),
    },
    {
      number: '05',
      icon: CheckCircle,
      title: t('workflow.step5Title'),
      desc: t('workflow.step5Desc'),
    },
  ];

  return (
    <section 
      id="how-it-works" 
      className="py-16 sm:py-24 bg-secondary/40 border-y border-border"
      aria-labelledby="workflow-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="badge-tag bg-surface text-primary border border-border">
            {t('workflow.sectionTag')}
          </span>
          <h2 id="workflow-heading" className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
            {t('workflow.title')}
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            {t('workflow.subtitle')}
          </p>
        </div>

        {/* 5-Step Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx}
                className="card-harvest p-5 space-y-4 bg-surface relative flex flex-col justify-between"
              >
                {/* Step Top Bar */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-primary/30 tracking-tight">
                    {step.number}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center border border-primary/20">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>

                {/* Step Content */}
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-bold text-base text-text leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 text-[11px] font-semibold text-primary">
                  Step {idx + 1} of 5
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer Callout */}
        <div className="max-w-3xl mx-auto p-4 rounded-xl bg-surface border border-border flex items-start gap-3 text-xs text-muted">
          <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            {t('workflow.disclaimer')}
          </p>
        </div>
      </div>
    </section>
  );
}
