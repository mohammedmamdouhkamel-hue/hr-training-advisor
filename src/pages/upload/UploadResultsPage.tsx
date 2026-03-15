import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadView from '../../components/upload/UploadView';
import DataSummaryCard from '../../components/upload/DataSummaryCard';
import { useEmployees } from '../../hooks/useEmployees';
import { useFileUpload } from '../../hooks/useFileUpload';

export default function UploadResultsPage() {
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const navigate = useNavigate();
  const { employees, setEmployees, setSelected, setUploadedFile, setUploadMeta, uploadMeta, clearResults } = useEmployees();

  const { handleFile, loadSample } = useFileUpload({
    setEmployees,
    setSelected,
    setPlans: () => {},
    setUploadedFile,
    setUploadMeta,
    setError,
    setView: () => {
      setShowUploadForm(false);
      navigate('/dashboard');
    },
  });

  const hasData = employees.length > 0 && uploadMeta;

  // Mode A: data exists — show summary + optional re-upload
  if (hasData && !showUploadForm) {
    return (
      <DataSummaryCard
        employees={employees}
        uploadMeta={uploadMeta}
        onReUpload={() => setShowUploadForm(true)}
        onReset={() => {
          clearResults();
          setShowUploadForm(false);
        }}
      />
    );
  }

  // Mode B: no data or re-upload requested — show upload form
  return <UploadView onFileSelect={handleFile} onLoadSample={loadSample} error={error} />;
}
