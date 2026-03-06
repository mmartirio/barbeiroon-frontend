import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import logo from '../../../assets/logo-meu-barbeiro.png'; // Verifique o caminho

import './pdfGenerator.css'; // Importa o arquivo de estilos
import { useTranslation } from 'react-i18next';
import FeedbackMessage from '../../FeedbackMessage';

const PDFGenerator = ({ servicesDescription, totalValue, totalDuration, onDownloadComplete }) => {
  const [showAlert, setShowAlert] = useState(false);

  const handleGeneratePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 portrait
    const { width, height } = page.getSize();

    // Fonte padrão
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Adiciona título
    page.drawText(t('pdf.title') || 'Resumo dos Serviços Selecionados', {
      x: 40,
      y: height - 60,
      size: 18,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Adiciona dados
    page.drawText(`Serviços: ${servicesDescription}`, {
      x: 40,
      y: height - 100,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${t('pdf.services') || 'Serviços'}: ${servicesDescription}`, {
      x: 40,
      y: height - 120,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Duração Total: ${totalDuration} min`, {
      x: 40,
      y: height - 140,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // Gera o PDF e faz download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Agendamento-barbeiro.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Chama a função de callback para sinalizar a conclusão do download
    onDownloadComplete();
  };

  const handleClick = () => {
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
      handleGeneratePDF(); // Gera o PDF após 2 segundos
    }, 2000);
  };

  return (
    <div>
      <FeedbackMessage
        message={showAlert ? 'Agendamento realizado com sucesso!' : ''}
        type="success"
        onClose={() => setShowAlert(false)}
      />
      <button className='btn-serv' onClick={handleClick}>
        Aceitar e Gerar PDF
      </button>
    </div>
  );
};

export default PDFGenerator;
