import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * 수업지도안 요소를 브라우저 인쇄 다이얼로그를 통해 PDF로 저장합니다.
 * (한글 폰트 및 공문 서식 보존에 가장 안정적인 방식)
 */
export function printLessonPlan(): void {
  window.print();
}

/**
 * HTML 요소를 캡처하여 PDF 파일로 직접 다운로드합니다.
 */
export async function exportLessonPlanToPdf(elementId: string, filename = '수업지도안.pdf'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('지도안 요소를 찾을 수 없습니다.');
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('PDF 내보내기 오류:', error);
    // Fallback으로 브라우저 인쇄 호출
    window.print();
  }
}
