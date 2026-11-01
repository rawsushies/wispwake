import React, { useState } from 'react';
import { Sparkles, Wand2, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, Layers } from 'lucide-react';
import { GENERATED_ASSETS } from '../game/config/gameConfig';

interface ArtForgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBackdrop: (layer: 'far_sky' | 'mid_roots', dataUrl: string) => void;
}

type StudioTab = 'pro_generate' | 'nano_edit' | 'asset_manifest';
type ImageSizeOption = '1K' | '2K' | '4K';
type AspectRatioOption = '16:9' | '4:3' | '1:1';

const PRESET_PROMPTS = [
  {
    label: 'Twilight Canopy Sky (Far Layer)',
    prompt:
      'Vast twilight forest canopy of the Veilgrove, colossal ancient tree silhouettes reaching into a deep dusk sky, drifting pale mist between branches, gouache storybook painting.',
    ratio: '16:9' as AspectRatioOption,
    targetLayer: 'far_sky' as const,
  },
  {
    label: 'Luminous Root Archways (Mid Layer)',
    prompt:
      'Immense sweeping tree roots covered in bioluminescent moss and hanging Veil Teal vines, shafts of golden-mint light piercing the sleeping forest.',
    ratio: '16:9' as AspectRatioOption,
    targetLayer: 'mid_roots' as const,
  },
  {
    label: 'Awakened Golden Sanctuary',
    prompt:
      'Ancient forest sanctuary after the Wake restoration, glowing Sap Gold lotus blooms and floating spores illuminating giant mossy roots in warm light.',
    ratio: '16:9' as AspectRatioOption,
    targetLayer: 'far_sky' as const,
  },
];

const REFERENCE_PLATES = [
  {
    id: 'far_sky',
    name: 'Canopy Far Sky Plate',
    category: 'Environment (Far Sky · 16:9)',
    url: GENERATED_ASSETS.bgCanopyFarSky,
  },
  {
    id: 'mid_roots',
    name: 'Midground Giant Roots Plate',
    category: 'Environment (Midground · 16:9)',
    url: GENERATED_ASSETS.bgCanopyGiantRoots,
  },
  {
    id: 'nima_pip',
    name: 'Nima & Pip Character Sheet',
    category: 'Character Reference (1:1)',
    url: GENERATED_ASSETS.refNimaPipConcept,
  },
  {
    id: 'ancient_bloom',
    name: 'Ancient Bloom Landmark Shrine',
    category: 'Landmark Reference (4:3)',
    url: GENERATED_ASSETS.refAncientBloomShrine,
  },
];

export const ArtForgerModal: React.FC<ArtForgerModalProps> = ({
  isOpen,
  onClose,
  onApplyBackdrop,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('pro_generate');

  // High-res Pro Image state (gemini-3-pro-image with 1K, 2K, 4K)
  const [proPrompt, setProPrompt] = useState(PRESET_PROMPTS[0].prompt);
  const [imageSize, setImageSize] = useState<ImageSizeOption>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('16:9');
  const [proLoading, setProLoading] = useState(false);
  const [proResultUrl, setProResultUrl] = useState<string | null>(null);
  const [proError, setProError] = useState<string | null>(null);

  // Create & Edit state (gemini-nano-banana-2.1)
  const [nanoPrompt, setNanoPrompt] = useState(
    'Add warm Sap Gold fireflies, glowing Wake Mint fern blossoms, and soft shafts of dawn light across the roots.'
  );
  const [selectedSourceUrl, setSelectedSourceUrl] = useState<string | null>(GENERATED_ASSETS.bgCanopyGiantRoots);
  const [nanoSize, setNanoSize] = useState<ImageSizeOption>('1K');
  const [nanoLoading, setNanoLoading] = useState(false);
  const [nanoResultUrl, setNanoResultUrl] = useState<string | null>(null);
  const [nanoError, setNanoError] = useState<string | null>(null);

  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  const urlToBase64 = async (url: string): Promise<{ base64: string; mimeType: string }> => {
    if (url.startsWith('data:')) {
      const [header, data] = url.split(',');
      const mimeMatch = header.match(/data:(.*?);/);
      return { base64: data, mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg' };
    }
    const resp = await fetch(url);
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const [header, data] = res.split(',');
        const mimeMatch = header.match(/data:(.*?);/);
        resolve({ base64: data, mimeType: mimeMatch ? mimeMatch[1] : blob.type || 'image/jpeg' });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGeneratePro = async () => {
    setProLoading(true);
    setProError(null);
    setAppliedBanner(null);
    try {
      const response = await fetch('/api/art/generate-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: proPrompt,
          imageSize,
          aspectRatio,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate artwork.');
      }
      setProResultUrl(data.imageUrl);
    } catch (err: unknown) {
      setProError(err instanceof Error ? err.message : 'Error calling gemini-3-pro-image');
    } finally {
      setProLoading(false);
    }
  };

  const handleNanoCreateOrEdit = async () => {
    setNanoLoading(true);
    setNanoError(null);
    setAppliedBanner(null);
    try {
      let base64Image: string | undefined;
      let mimeType = 'image/jpeg';

      if (selectedSourceUrl) {
        const converted = await urlToBase64(selectedSourceUrl);
        base64Image = converted.base64;
        mimeType = converted.mimeType;
      }

      const response = await fetch('/api/art/nano-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: nanoPrompt,
          base64Image,
          mimeType,
          aspectRatio: '16:9',
          imageSize: nanoSize,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to edit or create image.');
      }
      setNanoResultUrl(data.imageUrl);
    } catch (err: unknown) {
      setNanoError(err instanceof Error ? err.message : 'Error calling gemini-nano-banana-2.1');
    } finally {
      setNanoLoading(false);
    }
  };

  const handleApplyToGame = (layer: 'far_sky' | 'mid_roots', url: string) => {
    onApplyBackdrop(layer, url);
    setAppliedBanner(
      layer === 'far_sky'
        ? 'Applied to Live Game · Far Canopy Sky Layer'
        : 'Applied to Live Game · Midground Giant Roots Layer'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121B2B]/90 p-4 pointer-events-auto">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-[#1D2D43] border border-[#294D4D] text-[#E6EFEA] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#121B2B] border-b border-[#294D4D]">
          <div>
            <h2 className="text-2xl font-semibold tracking-wide text-[#F1C878] font-serif-display">
              Veilgrove Art Forger & Asset Studio
            </h2>
            <p className="text-xs text-[#A7B8AE]">
              Generate 1K/2K/4K world plates with Gemini Pro Image or edit scenes with Gemini Nano Banana 2.1
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#294D4D] hover:bg-[#57725B] text-xs font-medium text-[#E6EFEA] transition-colors whitespace-nowrap shrink-0"
          >
            Close Studio
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-[#162235] border-b border-[#294D4D]">
          <button
            onClick={() => setActiveTab('pro_generate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'pro_generate'
                ? 'bg-[#8FE7C7] text-[#121B2B] font-semibold'
                : 'bg-[#1D2D43] text-[#A7B8AE] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Res Art Generator (1K / 2K / 4K)</span>
          </button>
          <button
            onClick={() => setActiveTab('nano_edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'nano_edit'
                ? 'bg-[#8FE7C7] text-[#121B2B] font-semibold'
                : 'bg-[#1D2D43] text-[#A7B8AE] hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Create & Edit Art (Nano Banana 2.1)</span>
          </button>
          <button
            onClick={() => setActiveTab('asset_manifest')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'asset_manifest'
                ? 'bg-[#8FE7C7] text-[#121B2B] font-semibold'
                : 'bg-[#1D2D43] text-[#A7B8AE] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Canonical Asset Inventory</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {appliedBanner && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#294D4D] border border-[#8FE7C7]/40 text-xs text-[#8FE7C7]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{appliedBanner}</span>
            </div>
          )}

          {activeTab === 'pro_generate' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#A7B8AE] mb-1.5">
                    Veilgrove Preset Prompts
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PROMPTS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setProPrompt(preset.prompt);
                          setAspectRatio(preset.ratio);
                        }}
                        className="px-2.5 py-1.5 rounded bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-xs text-[#E6EFEA] transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A7B8AE] mb-1.5">
                    Artwork Prompt (gemini-3-pro-image)
                  </label>
                  <textarea
                    rows={4}
                    value={proPrompt}
                    onChange={(e) => setProPrompt(e.target.value)}
                    className="w-full rounded-lg bg-[#121B2B] border border-[#294D4D] p-3 text-sm text-[#E6EFEA] focus:outline-none focus:border-[#8FE7C7]"
                    placeholder="Describe a Veilgrove environment plate, landmark, or creature..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A7B8AE] mb-1.5">
                      Resolution Size (1K / 2K / 4K)
                    </label>
                    <div className="flex items-center gap-1.5 bg-[#121B2B] p-1 rounded-lg border border-[#294D4D]">
                      {(['1K', '2K', '4K'] as ImageSizeOption[]).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setImageSize(sz)}
                          className={`flex-1 py-1.5 rounded text-xs font-mono-tabular font-medium transition-colors ${
                            imageSize === sz
                              ? 'bg-[#F1C878] text-[#121B2B] font-semibold'
                              : 'text-[#A7B8AE] hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#A7B8AE] mb-1.5">
                      Aspect Ratio
                    </label>
                    <div className="flex items-center gap-1.5 bg-[#121B2B] p-1 rounded-lg border border-[#294D4D]">
                      {(['16:9', '4:3', '1:1'] as AspectRatioOption[]).map((ar) => (
                        <button
                          key={ar}
                          onClick={() => setAspectRatio(ar)}
                          className={`flex-1 py-1.5 rounded text-xs font-mono-tabular font-medium transition-colors ${
                            aspectRatio === ar
                              ? 'bg-[#8FE7C7] text-[#121B2B] font-semibold'
                              : 'text-[#A7B8AE] hover:text-white'
                          }`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGeneratePro}
                  disabled={proLoading || !proPrompt.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#F1C878] hover:bg-[#f5d592] disabled:opacity-50 text-[#121B2B] font-semibold text-sm transition-colors"
                >
                  {proLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Painting {imageSize} Plate...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate {imageSize} Artwork</span>
                    </>
                  )}
                </button>

                {proError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[#E98372]/15 border border-[#E98372] text-xs text-[#E98372]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{proError}</span>
                  </div>
                )}
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between rounded-lg bg-[#121B2B] border border-[#294D4D] p-4">
                {proResultUrl ? (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border border-[#294D4D] bg-black/40 aspect-video flex items-center justify-center">
                      <img
                        src={proResultUrl}
                        alt="Generated Veilgrove Artwork"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleApplyToGame('far_sky', proResultUrl)}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#8FE7C7] hover:bg-[#a6f0d6] text-[#121B2B] text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        Apply as Far Canopy Sky
                      </button>
                      <button
                        onClick={() => handleApplyToGame('mid_roots', proResultUrl)}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#294D4D] hover:bg-[#57725B] text-[#E6EFEA] text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        Apply as Midground Roots
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 text-[#A7B8AE]">
                    <ImageIcon className="w-10 h-10 mb-3 text-[#57725B]" />
                    <p className="text-sm font-medium text-[#E6EFEA]">No Custom Plate Generated Yet</p>
                    <p className="text-xs mt-1 max-w-xs">
                      Choose 1K, 2K, or 4K resolution and generate a new Veilgrove painting to hot-swap directly into the live Phaser parallax layers.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'nano_edit' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#A7B8AE] mb-1.5">
                    1. Select Source Plate to Edit (or Clear for Pure Text-to-Image)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {REFERENCE_PLATES.map((plate) => (
                      <button
                        key={plate.id}
                        onClick={() => setSelectedSourceUrl(plate.url)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                          selectedSourceUrl === plate.url
                            ? 'bg-[#294D4D] border-[#8FE7C7] text-white'
                            : 'bg-[#121B2B] border-[#294D4D] text-[#A7B8AE] hover:text-white'
                        }`}
                      >
                        <img
                          src={plate.url}
                          alt={plate.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{plate.name}</div>
                          <div className="text-[11px] text-[#8FE7C7] truncate">{plate.category}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedSourceUrl && (
                    <button
                      onClick={() => setSelectedSourceUrl(null)}
                      className="mt-2 text-xs text-[#F1C878] hover:underline"
                    >
                      Clear source image (create from text prompt only)
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A7B8AE] mb-1.5">
                    2. Edit Instruction or Creation Prompt (gemini-nano-banana-2.1)
                  </label>
                  <textarea
                    rows={3}
                    value={nanoPrompt}
                    onChange={(e) => setNanoPrompt(e.target.value)}
                    className="w-full rounded-lg bg-[#121B2B] border border-[#294D4D] p-3 text-sm text-[#E6EFEA] focus:outline-none focus:border-[#8FE7C7]"
                    placeholder="Describe how to transform the plate or what new scene to create..."
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 bg-[#121B2B] p-1 rounded-lg border border-[#294D4D]">
                    {(['1K', '2K', '4K'] as ImageSizeOption[]).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setNanoSize(sz)}
                        className={`px-3 py-1 rounded text-xs font-mono-tabular font-medium transition-colors ${
                          nanoSize === sz
                            ? 'bg-[#8FE7C7] text-[#121B2B] font-semibold'
                            : 'text-[#A7B8AE] hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNanoCreateOrEdit}
                    disabled={nanoLoading || !nanoPrompt.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#8FE7C7] hover:bg-[#a6f0d6] disabled:opacity-50 text-[#121B2B] font-semibold text-sm transition-colors"
                  >
                    {nanoLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transforming with Nano Banana 2.1...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>{selectedSourceUrl ? 'Edit Selected Artwork' : 'Create Artwork'}</span>
                      </>
                    )}
                  </button>
                </div>

                {nanoError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[#E98372]/15 border border-[#E98372] text-xs text-[#E98372]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{nanoError}</span>
                  </div>
                )}
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between rounded-lg bg-[#121B2B] border border-[#294D4D] p-4">
                {nanoResultUrl ? (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border border-[#294D4D] bg-black/40 aspect-video flex items-center justify-center">
                      <img
                        src={nanoResultUrl}
                        alt="Edited Veilgrove Artwork"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleApplyToGame('mid_roots', nanoResultUrl)}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#8FE7C7] hover:bg-[#a6f0d6] text-[#121B2B] text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        Apply as Midground Roots
                      </button>
                      <button
                        onClick={() => handleApplyToGame('far_sky', nanoResultUrl)}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#294D4D] hover:bg-[#57725B] text-[#E6EFEA] text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        Apply as Far Canopy Sky
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-[#A7B8AE]">
                      {selectedSourceUrl ? 'Active Source Reference Plate:' : 'Text-Only Creation Mode'}
                    </div>
                    {selectedSourceUrl && (
                      <div className="rounded-lg overflow-hidden border border-[#294D4D] aspect-video bg-black/30">
                        <img
                          src={selectedSourceUrl}
                          alt="Source Reference"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-xs text-[#A7B8AE]">
                      Use <span className="text-[#8FE7C7]">gemini-nano-banana-2.1</span> to paint additional bioluminescent flora, lighting shifts, or seasonal restoration details onto any canonical Wispwake plate.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'asset_manifest' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REFERENCE_PLATES.map((plate) => (
                  <div
                    key={plate.id}
                    className="rounded-lg bg-[#121B2B] border border-[#294D4D] overflow-hidden flex flex-col"
                  >
                    <div className="aspect-video bg-black/40 overflow-hidden">
                      <img
                        src={plate.url}
                        alt={plate.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-[#E6EFEA]">{plate.name}</div>
                        <div className="text-xs text-[#A7B8AE]">{plate.category}</div>
                      </div>
                      <span className="text-xs font-mono-tabular text-[#8FE7C7]">Verified Original</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
