import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { HelpCircle, BookOpen, MessageSquare, PhoneCall, ExternalLink, LifeBuoy } from 'lucide-react';
import './HelpSupportView.css';

export interface HelpSupportViewProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onOpenRaiseRequest: () => void;
}

export const HelpSupportView: React.FC<HelpSupportViewProps> = ({ onShowToast, onOpenRaiseRequest }) => {
  return (
    <div className="help-container">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: 'Help & Support' }
        ]}
        title="Help & Support Knowledgebase"
        subtitle="Find documentation, quick user guides, FAQs, or contact HR & IT Support operations."
        actions={
          <Button
            variant="primary"
            leftIcon={<LifeBuoy size={16} />}
            onClick={onOpenRaiseRequest}
          >
            + Raise Support Request
          </Button>
        }
      />

      <div className="help-grid-two">
        {/* CARD 1: FREQUENTLY ASKED QUESTIONS */}
        <div className="help-card">
          <div className="help-card-title">
            <HelpCircle size={18} style={{ color: 'var(--color-primary-600)' }} />
            Frequently Asked Questions (FAQ)
          </div>
          <div className="help-card-desc">
            Quick answers for common employee workforce questions.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: '8px' }}>
            <div className="faq-item">
              <span className="faq-q">How do I regularize a missing attendance punch?</span>
              <span className="faq-a">Click "+ Raise Request" and select Category: Attendance. Enter your shift date and punch details.</span>
            </div>

            <div className="faq-item">
              <span className="faq-q">How long does it take for payroll queries to resolve?</span>
              <span className="faq-a">Payroll Support team response target is 8 working hours, with a total resolution target of 2 working days.</span>
            </div>

            <div className="faq-item">
              <span className="faq-q">Can I reopen a ticket after it is marked as Resolved?</span>
              <span className="faq-a">Yes, employees can reopen any resolved ticket within 14 days directly from the Ticket Detail view.</span>
            </div>
          </div>
        </div>

        {/* CARD 2: DOCUMENTATION & DIRECT SUPPORT */}
        <div className="help-card">
          <div className="help-card-title">
            <BookOpen size={18} style={{ color: 'var(--color-primary-600)' }} />
            User Guides & Support Channels
          </div>
          <div className="help-card-desc">
            Explore Sixtifi Helpdesk user manuals or reach out directly to department administrators.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: '8px' }}>
            <div className="faq-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="faq-q" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} style={{ color: 'var(--color-primary-600)' }} />
                  HR Support Helpline
                </span>
                <span className="faq-a">hr-support@sixtifi.com · Ext 402</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => onShowToast('info', 'Contact HR', 'Dialing HR Support extension...')}>Contact</Button>
            </div>

            <div className="faq-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="faq-q" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PhoneCall size={14} style={{ color: 'var(--color-primary-600)' }} />
                  IT Service Desk Emergency
                </span>
                <span className="faq-a">it-desk@sixtifi.com · Ext 911</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => onShowToast('info', 'Contact IT', 'Dialing IT Helpdesk extension...')}>Contact</Button>
            </div>

            <div className="faq-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="faq-q" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExternalLink size={14} style={{ color: 'var(--color-primary-600)' }} />
                  Sixtifi WFM User Documentation
                </span>
                <span className="faq-a">Explore full workforce software manuals and SLA rules.</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onShowToast('info', 'Documentation', 'Opening Sixtifi Documentation portal...')}>View Manual</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
