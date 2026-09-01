import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { FormField, TextareaInput } from '../ui/FormControls';
import { Modal } from '../ui/Modal';
import { Eye, GitBranch, Save } from 'lucide-react';
import { CategoryConfigSnapshot, CategoryVersion, publishCategoryVersion } from '../../data/categoryConfig';
import '../../views/SlaEscalationView.css';

const CONFIG_ADMIN = 'Helpdesk Admin';

export interface CategoryVersionBarProps {
  categoryId: string;
  activeVersion?: CategoryVersion;
  versions: CategoryVersion[];
  hasUnpublishedChanges: boolean;
  onPublished: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
}

export const CategoryVersionBar: React.FC<CategoryVersionBarProps> = ({
  categoryId,
  activeVersion,
  versions,
  hasUnpublishedChanges,
  onPublished,
  onShowToast
}) => {
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const [viewingVersion, setViewingVersion] = useState<CategoryVersion | null>(null);

  const supersededWithOpenTickets = versions.filter(v => v.status === 'superseded' && v.openTicketsOnVersion > 0);

  const handlePublish = () => {
    const version = publishCategoryVersion(categoryId, CONFIG_ADMIN, publishNote);
    setPublishNote('');
    setPublishModalOpen(false);
    onPublished();
    onShowToast(
      'success',
      'Category version published',
      `${version.label} is active. Open tickets keep their existing version until closed.`
    );
  };

  return (
    <>
      <div className="cat-sla-panel-toolbar">
        <div className={`sla-version-banner${hasUnpublishedChanges ? ' has-draft' : ''}`} style={{ flex: 1 }}>
          <div className="sla-version-banner-main">
            <GitBranch size={18} className="sla-version-banner-icon" />
            <div>
              <div className="sla-version-banner-title">
                Active version: {activeVersion?.label ?? 'Not published yet'}
                {hasUnpublishedChanges && <span className="sla-version-draft-badge">Unpublished draft</span>}
              </div>
              <p className="sla-version-banner-text">
                Full category config is versioned. Open tickets keep the version they were created under.
              </p>
            </div>
          </div>
          {supersededWithOpenTickets.length > 0 && (
            <div className="sla-version-open-tickets">
              {supersededWithOpenTickets.map(v => (
                <span key={v.id} className="sla-version-open-ticket-pill">
                  {v.openTicketsOnVersion} open on {v.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Save size={14} />}
          disabled={!hasUnpublishedChanges}
          onClick={() => setPublishModalOpen(true)}
        >
          Publish version
        </Button>
      </div>

      {versions.length > 0 && (
        <div className="sla-config-card">
          <div className="sla-card-header">
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <GitBranch size={18} style={{ color: 'var(--color-primary-600)' }} />
              Version history
            </div>
          </div>
          <div className="sla-version-history-list">
            {[...versions].reverse().map(version => (
              <div key={version.id} className="sla-version-history-item">
                <div className="sla-version-history-main">
                  <div className="sla-version-history-title-row">
                    <span className="sla-version-history-label">{version.label}</span>
                    <span className={`sla-version-status-badge is-${version.status}`}>
                      {version.status === 'active' ? 'Active' : 'Superseded'}
                    </span>
                  </div>
                  {version.changeNote && <span className="sla-version-history-note">{version.changeNote}</span>}
                  <span className="sla-version-history-detail">
                    {version.snapshot.name} · {version.snapshot.assignedTeam}
                    {version.openTicketsOnVersion > 0 && version.status === 'superseded'
                      ? ` · ${version.openTicketsOnVersion} open tickets`
                      : ''}
                  </span>
                </div>
                <div className="sla-version-history-actions">
                  <span className="sla-config-history-time">{version.publishedAt}</span>
                  <Button variant="ghost" size="sm" leftIcon={<Eye size={13} />} onClick={() => setViewingVersion(version)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish category version"
        subtitle="Applies the full category configuration to new tickets in this category."
        footer={
          <>
            <Button variant="secondary" onClick={() => setPublishModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handlePublish}>Publish</Button>
          </>
        }
      >
        <FormField label="Change note (optional)">
          <TextareaInput value={publishNote} onChange={e => setPublishNote(e.target.value)} rows={3} />
        </FormField>
      </Modal>

      <Modal
        isOpen={!!viewingVersion}
        onClose={() => setViewingVersion(null)}
        title={viewingVersion ? `View ${viewingVersion.label}` : 'View version'}
        footer={<Button variant="secondary" onClick={() => setViewingVersion(null)}>Close</Button>}
      >
        {viewingVersion && <VersionSnapshotSummary snapshot={viewingVersion.snapshot} />}
      </Modal>
    </>
  );
};

function VersionSnapshotSummary({ snapshot }: { snapshot: CategoryConfigSnapshot }) {
  return (
    <div className="sla-version-view-panel" style={{ fontSize: 13, lineHeight: 1.6 }}>
      <div><strong>Name:</strong> {snapshot.name}</div>
      <div><strong>Team:</strong> {snapshot.assignedTeam}</div>
      <div><strong>Business hours:</strong> {snapshot.businessHours}</div>
      <div><strong>SLA:</strong> At risk {snapshot.sla.warningThreshold} · Critical {snapshot.sla.criticalThreshold}</div>
      <div><strong>Escalation:</strong> {snapshot.sla.slaExempt ? 'Off' : 'On'}</div>
      <div><strong>Notifications:</strong> {snapshot.notifications.enabled ? 'Enabled' : 'Disabled'}</div>
    </div>
  );
}
