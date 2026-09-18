import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="post-modal-backdrop" onClick={onClose} style={{ zIndex: 4000 }}>
      <div
        className="post-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          height: 'auto',
          maxHeight: '90vh',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: 'rgba(19, 28, 49, 0.98)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 'none', padding: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isDanger && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                <AlertTriangle size={18} />
              </div>
            )}
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-text-main)', margin: '0' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--color-text-muted)', margin: '0' }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            className="post-edit-btn cancel"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--color-text-muted)',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              background: isDanger ? '#ef4444' : 'var(--color-accent)',
              color: '#ffffff',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
