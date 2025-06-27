import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiTrash2, FiFileText, FiAlertTriangle } from 'react-icons/fi';
import { ThreeDots } from 'react-loader-spinner';
import { fetchDocumentAnalysis, fetchDocumentSummary, deleteDocument } from '../services/Api';
import AnalysisSection from '../components/common/AnalysisSection';
import RiskChart from '../components/documents/RiskChart';
import EntityVisualization from '../components/documents/EntityVisualization';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          <h3>Component Error:</h3>
          <pre>{this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Immediately set document from navigation state, if available
  const [document, setDocument] = useState(location.state?.document || null);
  const [loading, setLoading] = useState(!document); // Only load if we don't have the doc

  useEffect(() => {
    if (!id) return;

    const loadDocumentData = async () => {
      // If we don't have the document data from navigation, we can't proceed
      if (!document) {
        console.error("Document data not available from navigation.");
        setLoading(false);
        // Optionally, navigate away or try to fetch the base document
        navigate('/documents');
        return;
      }
      
      setLoading(false); // We have basic info, stop full-page loading

      // Fetch summary
      try {
        const summaryRes = await fetchDocumentSummary(id);
        if (summaryRes.data.summary) {
          setDocument(prevDoc => ({
            ...prevDoc,
            analysis: { ...prevDoc.analysis, ...summaryRes.data.summary }
          }));
        }
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      }

      // Fetch analysis
      try {
        const analysisRes = await fetchDocumentAnalysis(id);
        if (analysisRes.data) {
          setDocument(prevDoc => ({
            ...prevDoc,
            analysis: { ...prevDoc.analysis, ...analysisRes.data },
            entities: analysisRes.data.highlights, // Populate entities
          }));
        }
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
      }
    };

    loadDocumentData();
  }, [id, navigate]);

  const handleDeleteDocument = async () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(id);
        navigate('/documents');
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="pt-24 flex justify-center">
        <ThreeDots color="#4F46E5" height={50} width={50} />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="pt-24 text-center text-red-500">
        Document not found or failed to load
      </div>
    );
  }

  // Default values for rendering before all data has arrived
  const analysis = document.analysis || {};
  const entities = document.entities || {};
  const risks = analysis.identified_risks || [];
  const grammaticalIssues = analysis.grammatical_issues || [];
  const fraudIndicators = analysis.fraud_indicators || [];

  return (
    <ErrorBoundary>
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{document.originalname || 'Document'}</h1>
            <p className="text-gray-500 mt-2">
              Uploaded: {new Date(document.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
          <button
            className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center"
            onClick={handleDeleteDocument}
            aria-label="Delete document"
          >
            <FiTrash2 className="mr-2" /> Delete Document
          </button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <AnalysisSection
            title="Document Type"
            icon={<FiFileText />}
            content={analysis.document_type || <ThreeDots color="#4F46E5" height={20} width={20} />}
          />

          <ErrorBoundary>
            <AnalysisSection
              title="Identified Risks"
              icon={<FiAlertTriangle />}
              content={
                risks.length > 0 ? (
                  <RiskChart risks={risks} />
                ) : (analysis.document_type ? 'No risks identified' : <ThreeDots color="#4F46E5" height={20} width={20} />)
              }
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <AnalysisSection
              title="Grammatical Issues"
              icon={<FiFileText />}
              content={
                grammaticalIssues.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {grammaticalIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                ) : (analysis.document_type ? 'No grammatical issues found' : <ThreeDots color="#4F46E5" height={20} width={20} />)
              }
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <AnalysisSection
              title="Fraud Indicators"
              icon={<FiAlertTriangle />}
              content={
                fraudIndicators.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {fraudIndicators.map((indicator, index) => (
                      <li key={index}>{indicator}</li>
                    ))}
                  </ul>
                ) : (analysis.document_type ? 'No fraud indicators detected' : <ThreeDots color="#4F46E5" height={20} width={20} />)
              }
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <AnalysisSection
              title="Plain-English Summary"
              icon={<FiFileText />}
              content={analysis.plain_english_summary || <ThreeDots color="#4F46E5" height={20} width={20} />}
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <AnalysisSection
              title="Entity & Clause"
              icon={<FiFileText />}
              content={
                Object.keys(entities).length > 0 ? (
                  <EntityVisualization entities={entities} />
                ) : (analysis.document_type ? 'No entities available' : <ThreeDots color="#4F46E5" height={20} width={20} />)
              }
            />
          </ErrorBoundary>

          <div className="bg-white rounded-xl p-6 shadow-sm md:col-span-2">
            <h3 className="text-xl font-semibold mb-4">Full Text</h3>
            <div className="prose max-h-96 overflow-y-auto whitespace-pre-wrap">
              {document.text ? (
                <pre className="whitespace-pre-wrap">{document.text}</pre>
              ) : (
                <div className="text-gray-400 text-sm">
                  <p>Text content not available</p>
                  <ul className="list-disc pl-4 mt-2">
                    <li>Document might still be processing</li>
                    <li>Text extraction might have failed</li>
                    <li>Unsupported file format</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

