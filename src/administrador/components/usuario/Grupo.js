import React, { useState } from 'react';
import Sidebar from '../../painel/sidebar/Sidebar';
import '../../painel/AdminDashboard.css';
import './Grupo.css';

export const PERMISSOES = [
	{
		categoria: 'Usuário',
		permissoes: [
			{ key: 'canCreateUser', label: 'Criar' },
			{ key: 'canEditUser', label: 'Editar' },
			{ key: 'canDeleteUser', label: 'Excluir' },
		],
	},
	{
		categoria: 'Clientes',
		permissoes: [
			{ key: 'canCreateCustomer', label: 'Criar' },
			{ key: 'canEditCustomer', label: 'Editar' },
			{ key: 'canDeleteCustomer', label: 'Excluir' },
		],
	},
	{
		categoria: 'Agendamento',
		permissoes: [
			{ key: 'canCreateAppointment', label: 'Criar' },
			{ key: 'canEditAppointment', label: 'Editar' },
			{ key: 'canDeleteAppointment', label: 'Excluir' },
			{ key: 'canViewAllAppointments', label: 'Para todos' },
			{ key: 'canViewOwnAppointments', label: 'Seu agendamento' },
		],
	},
	{
		categoria: 'Conta',
		permissoes: [
			{ key: 'canEditAccount', label: 'Editar' },
			{ key: 'canDeleteAccount', label: 'Excluir' },
			{ key: 'canChangeLogo', label: 'Alterar logo' },
		],
	},
	{
		categoria: 'Relatório',
		permissoes: [
			{ key: 'canViewGeneralReport', label: 'Geral' },
			{ key: 'canViewIndividualReport', label: 'Individual' },
		],
	},
	{
		categoria: 'Serviços',
		permissoes: [
			{ key: 'canCreateService', label: 'Criar' },
			{ key: 'canEditService', label: 'Editar' },
			{ key: 'canDeleteService', label: 'Excluir' },
		],
	},
	{
		categoria: 'Dashboard',
		permissoes: [
			{ key: 'canViewDashboard', label: 'Visualizar dashboard' },
			{ key: 'canViewTotalClients', label: 'Total de clientes' },
			{ key: 'canViewMonthlyRevenue', label: 'Faturamento Mensal' },
			{ key: 'canViewServicesDone', label: 'Serviços realizados' },
			{ key: 'canViewTopServices', label: 'Serviços mais vendidos' },
			{ key: 'canViewBirthdays', label: 'Aniversariantes do mês' },
		],
	},
];

function SuccessModal({ open, onClose, groupName }) {
	if (!open) return null;
	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				background: 'rgba(0,0,0,0.35)',
				zIndex: 3000,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div
				style={{
					background: '#fff',
					borderRadius: 16,
					padding: 36,
					minWidth: 320,
					boxShadow: '0 8px 32px #0002',
					textAlign: 'center',
				}}
			>
				<h3
					style={{
						color: '#22c55e',
						marginBottom: 12,
					}}
				>
					Grupo criado!
				</h3>
				<div
					style={{
						color: '#222',
						fontSize: 17,
						marginBottom: 18,
					}}
				>
					O grupo <b>{groupName}</b> foi criado com sucesso.
				</div>
				<button
					onClick={onClose}
					style={{
						background: 'linear-gradient(90deg,#007aff,#00d4ff)',
						color: '#fff',
						border: 'none',
						borderRadius: 6,
						padding: '8px 32px',
						fontWeight: 700,
						fontSize: 15,
						cursor: 'pointer',
						boxShadow: '0 2px 8px #007aff22',
						minWidth: 120,
					}}
				>
					OK
				</button>
			</div>
		</div>
	);
}

export default function Grupo() {
	// ...existing code...
	const [perms, setPerms] = useState({});
	const [groupName, setGroupName] = useState('');
	const [successMsg, setSuccessMsg] = useState('');
	const [errorMsg, setErrorMsg] = useState('');
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [createdGroups, setCreatedGroups] = useState([]);

	const handleChange = (key) => {
		setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSuccessMsg('');
		setErrorMsg('');
		if (!groupName.trim()) {
			setErrorMsg('Informe um nome para o grupo.');
			return;
		}
		setLoading(true);
		try {
			// Salva grupo em estado local
			setCreatedGroups(prev => [...prev, { name: groupName, permissions: { ...perms } }]);
			setSuccessMsg('Grupo criado com sucesso!');
			setModalOpen(true);
			setGroupName('');
			setPerms({});
		} catch (err) {
			setErrorMsg('Erro ao criar grupo.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="admin-dashboard">
			<Sidebar />
			<main className="main-content-unified portal-layout">
				<div className="portal-card portal-card--narrow">
					<div className="portal-card-header">
						<h2 className="portal-card-title">Criar Grupo de Permissões</h2>
						<p className="portal-card-subtitle">Nomeie o grupo e selecione as permissões desejadas. Cada grupo pode ter qualquer combinação de permissões.</p>
					</div>
					<div className="portal-card-body">
						<form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							<div style={{ marginBottom: 18, width: '100%' }}>
								<label htmlFor="groupName" style={{ fontWeight: 600, color: '#e5e7eb', fontSize: 17, display: 'block', marginBottom: 6, textAlign: 'center' }}>Nome do Grupo:</label>
								<input id="groupName" type="text" value={groupName} onChange={e => setGroupName(e.target.value)} style={{ width: '100%', maxWidth: 320, margin: '0 auto', display: 'block', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none' }} placeholder="Ex: Atendente, Barbeiro, Gerente..." required />
							</div>
							<button type="submit" disabled={loading} style={{ background: 'linear-gradient(90deg,#007aff,#00d4ff)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #007aff22', marginTop: 0, minWidth: 160, width: '100%', maxWidth: 320 }}>
								{loading ? 'Salvando...' : 'Criar Grupo'}
							</button>
						</form>
						{errorMsg && <div style={{ color: '#ef4444', margin: '12px 0', textAlign: 'center' }}>{errorMsg}</div>}
						<div className="grupo-perms-box" style={{ marginBottom: 18, background: 'none', border: 'none', boxShadow: 'none', padding: 0, marginTop: 24 }}>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32, justifyContent: 'center' }}>
								{PERMISSOES.map((cat) => (
									<div key={cat.categoria} style={{ marginBottom: 22 }}>
										<div className="grupo-perms-cat" style={{ fontSize: 18, color: '#e5e7eb', marginBottom: 8, borderBottom: '1.5px solid #e5e7eb', paddingBottom: 2, textAlign: 'center' }}>{cat.categoria}</div>
										<div
											className="grupo-perms-list"
											style={cat.categoria === 'Dashboard'
												? { display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }
												: { display: 'flex', flexDirection: 'row', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }
											}
										>
											{cat.permissoes.map((perm) => (
												<label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: 15, color: '#e5e7eb' }}>
													<input type="checkbox" checked={!!perms[perm.key]} onChange={() => handleChange(perm.key)} />
													{perm.label}
												</label>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
						<SuccessModal open={modalOpen} onClose={() => setModalOpen(false)} groupName={successMsg ? groupName : ''} />
					</div>
				</div>
			</main>
		</div>
	);
}
