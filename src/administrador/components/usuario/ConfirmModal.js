
import React from 'react';
import ReactDOM from 'react-dom';
import './ConfirmModal.css';
import Button from '../../../components/Button';

const ConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content">
        <h3 id="modal-title">Confirmar Remoção</h3>
        <p>Você tem certeza que deseja remover este usuário?</p>
        <div className="modal-actions">
          <Button variant="danger" autoFocus onClick={onConfirm} aria-label="Confirmar remoção">Confirmar</Button>
          <Button variant="secondary" onClick={onCancel} aria-label="Cancelar remoção">Cancelar</Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
