import React from 'react';
import './LogoHeader.css';
import Logo from '../../assets/logo-meu-barbeiro.png';

const LogoHeader = () => {
    return (
        <div className="logo-header">
            <img className='logo-header-image' src={Logo} alt='logo' title='logo' />
            <span className="logo-header-text">Meu Barbeiro</span>
        </div>
    );
};

export default LogoHeader;
