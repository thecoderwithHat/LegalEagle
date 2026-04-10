import React, { useMemo } from 'react';

const PROVIDER_MODELS = {
  openrouter: ['google/gemma-4-31b-it'],
  gemini: ['gemini-1.5-flash', 'gemini-3-flash-preview'],
  ollama: ['qwen3.5:0.8b', 'qwen2.5:7b', 'mistral:7b']
};

export default function ProviderModelPicker({
  provider,
  model,
  onProviderChange,
  onModelChange,
  onApply,
  loading
}) {
  const modelOptions = useMemo(() => {
    return PROVIDER_MODELS[provider] || [];
  }, [provider]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Runtime</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label htmlFor="provider" className="block text-xs text-gray-500 mb-1">Provider</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="openrouter">OpenRouter</option>
            <option value="gemini">Gemini</option>
            <option value="ollama">Ollama (Local)</option>
          </select>
        </div>

        <div>
          <label htmlFor="model" className="block text-xs text-gray-500 mb-1">Model</label>
          <select
            id="model"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {modelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onApply}
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Applying...' : 'Apply & Re-Summarize'}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Ollama uses your local server at OLLAMA_BASE_URL.
      </p>
    </div>
  );
}
