"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type LifejacketServiceItem } from "@/modules/lifejackets/lifejacketModelData";
import {
  STATUS_OPTIONS,
  CHECKLIST_FIELDS,
  YES_NO_OPTIONS,
  REPLACEMENT_OPTIONS,
  type VerificacaoColete,
  type StockItemLite,
  type StockSearchState,
  type ReplacementFlag,
  type MechanismType,
  type InflacaoDetalhes,
  type ManualChecklistState,
  type AuxiliaryChecklistEntry,
  type ChecklistFieldKey,
  type ChecklistFieldConfig,
  type FichaVerificacaoMultiplaProps,
  MANUAL_CHECKLIST_MARKER,
} from "@/types/ficha-verificacao-multipla";
import {
  normalizeText,
  matchFieldForServiceItem,
  serviceItemSignature,
  resolveTechnicalCatalog,
  buildMechanismRecommendations,
  orderMechanismOptions,
  createInitialForm,
  createInitialInflacaoDetalhes,
  normalizeDateYmd,
  mechanismSearchTerms,
  toStockLabel,
  findStockByReference,
  normalizeRefToken,
  hasReferenceMatch,
  findExactReferenceMatch,
  extractReferenceTokens,
  buildManualReferenceHints,
  buildLimitedSearchQuery,
  fetchStockOptions,
  resolveCertificateResult,
  splitManualChecklistFromObservacoes,
  parseInflacaoDetalhesFromObservacoes,
  buildInflacaoBlock,
} from "@/lib/ficha-verificacao-multipla-helpers";

export function FichaVerificacaoMultipla({
  coleteId,
  coleteSerial,
  marca,
  modelo,
  onSaved,
}: FichaVerificacaoMultiplaProps) {
  const [verificacoes, setVerificacoes] = useState<VerificacaoColete[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
    const [editingVerificationId, setEditingVerificationId] = useState<number | null>(null);
  const [formData, setFormData] = useState<VerificacaoColete>(createInitialForm(coleteId));
  const [manualChecklist, setManualChecklist] = useState<Record<string, ManualChecklistState>>({});
  const [inflacaoDetalhes, setInflacaoDetalhes] = useState<InflacaoDetalhes>(createInitialInflacaoDetalhes(false, false));
  const [stockCapsulas, setStockCapsulas] = useState<StockItemLite[]>([]);
  const [stockCilindros, setStockCilindros] = useState<StockItemLite[]>([]);
  const [stockClips, setStockClips] = useState<StockItemLite[]>([]);
  const [stockLuzes, setStockLuzes] = useState<StockItemLite[]>([]);
  const [stockSearch, setStockSearch] = useState<StockSearchState>({ capsula: "", cilindro: "", clip: "", luz: "" });
  const stockRequestIdRef = useRef(0);
  const [coleteData, setColeteData] = useState<any>(null);

  const isEditingVerification = editingVerificationId !== null;

  const { brandCatalog, model: technicalModel } = useMemo(
    () => resolveTechnicalCatalog(marca, modelo),
    [marca, modelo]
  );

  const serviceItems = technicalModel?.serviceItems || [];
  const serviceItemsByField = useMemo(() => {
    return serviceItems.reduce<Record<ChecklistFieldKey, LifejacketServiceItem[]>>((acc, item) => {
      const fieldKey = matchFieldForServiceItem(item);
      if (fieldKey) {
        acc[fieldKey].push(item);
      }
      return acc;
    }, {
      tecidoExterior: [],
      colagens: [],
      zataosVelcro: [],
      fitasReflectoras: [],
      sistemaInflacao: [],
      mecanismoInflacao: [],
      camaras: [],
      garrafaCO2: [],
      tuboInflador: [],
    });
  }, [serviceItems]);

  const mappedServiceItems = new Set(
    Object.values(serviceItemsByField)
      .flat()
      .map((item) => serviceItemSignature(item))
  );

  const uncoveredMandatoryItems = serviceItems.filter((item) => item.mandatory).filter(
    (item) => !mappedServiceItems.has(serviceItemSignature(item))
  );

  const isTwinChamber = normalizeText(technicalModel?.chamber).includes("dupla");
  const isAutomaticMechanism = inflacaoDetalhes.tipoMecanismo === "AUTOMATICO";
  const hasHarness = [technicalModel?.family, ...(technicalModel?.characteristics || [])].some((entry) =>
    normalizeText(entry).includes("arnes") || normalizeText(entry).includes("harness") || normalizeText(entry).includes("d ring")
  );
  const hasSprayhood = serviceItems.some((item) => normalizeText(item.name).includes("sprayhood"));
  const hasClip = serviceItems.some((item) => {
    const text = normalizeText([item.name, item.notes, item.reference].filter(Boolean).join(" "));
    return text.includes("clip") || text.includes("toggle") || text.includes("lanyard");
  });
  const hasLight = serviceItems.some((item) => normalizeText(item.name).includes("luz") || normalizeText(item.name).includes("light"));
  const requiresPacking = serviceItems.some((item) => normalizeText(item.name).includes("packing"));
  const recommendedMechanisms = useMemo(() => buildMechanismRecommendations(brandCatalog), [brandCatalog]);
  const mechanismOptions = useMemo(() => orderMechanismOptions(recommendedMechanisms), [recommendedMechanisms]);

  const fieldConfigs = useMemo<ChecklistFieldConfig[]>(() => {
    return CHECKLIST_FIELDS.map(({ key, label }) => {
      const linkedItems = serviceItemsByField[key] || [];
      const dynamicLabel = (() => {
        switch (key) {
          case "colagens":
            return hasHarness ? "Colagens / arnês" : label;
          case "fitasReflectoras":
            return hasLight ? "Fitas refletoras / acessórios" : label;
          case "camaras":
            return isTwinChamber ? "Câmaras / ensaio de retenção (dupla)" : "Câmara / ensaio de retenção";
          case "garrafaCO2":
            return isTwinChamber ? "Garrafa(s) CO₂ / peso e corrosão" : "Garrafa CO₂ / peso e corrosão";
          case "tuboInflador":
            return "Tubo oral / válvula anti-retorno";
          case "zataosVelcro":
            return requiresPacking ? "Fecho zip / velcro / packing" : label;
          default:
            return label;
        }
      })();

      const helperParts = linkedItems.flatMap((item) => {
        const extras = [item.interval, item.notes].filter(Boolean);
        return extras.length > 0 ? [`${item.name}: ${extras.join(" · ")}`] : [item.name];
      });

      return {
        key,
        label: dynamicLabel,
        helperText: helperParts.length > 0 ? helperParts.join(" | ") : undefined,
        linkedItems,
      };
    });
  }, [hasHarness, hasLight, isTwinChamber, requiresPacking, serviceItemsByField]);

  const technicalHighlights = useMemo(() => {
    const highlights: string[] = [];
    if (isTwinChamber) highlights.push("Dupla câmara: confirmar os dois sistemas de insuflação.");
    if (hasHarness) highlights.push("Modelo com arnês: verificar webbing, costuras e ponto de engate.");
    if (hasClip) highlights.push("Modelo com clip/toggle de segurança: registar referência e se houve substituição.");
    if (hasSprayhood) highlights.push("Acessórios relevantes: conferir sprayhood e respetivo estado.");
    if (hasLight) highlights.push("Acessórios luminosos: verificar luz/validade quando instalada.");
    if (requiresPacking) highlights.push("Modelo com requisito de packing/re-stow: documentar a conferência em observações.");
    return highlights;
  }, [hasClip, hasHarness, hasLight, hasSprayhood, isTwinChamber, requiresPacking]);

  const manualReferenceHints = useMemo(() => buildManualReferenceHints(serviceItems), [serviceItems]);

  const serviceItemEntries = useMemo(() => {
    return serviceItems.map((item, index) => {
      const key = `${index}:${normalizeText(item.name)}:${normalizeText(item.reference || "")}`;
      return { key, item };
    });
  }, [serviceItems]);

  const serviceEntryKeyByItem = useMemo(() => {
    const map = new Map<LifejacketServiceItem, string>();
    for (const entry of serviceItemEntries) {
      map.set(entry.item, entry.key);
    }
    return map;
  }, [serviceItemEntries]);

  const auxiliaryChecklistEntries = useMemo<AuxiliaryChecklistEntry[]>(() => {
    return [
      {
        key: "extra:apito",
        itemLabel: "Apito",
        helperText: "Confirmar presença, integridade e funcionamento.",
      },
    ];
  }, []);

  const uncoveredManualEntries = useMemo(() => {
    return serviceItemEntries.filter(({ item }) => !mappedServiceItems.has(serviceItemSignature(item)));
  }, [serviceItemEntries, mappedServiceItems]);

  const checklistLookupEntries = useMemo(() => {
    const entries: Array<{ key: string; lookup: string }> = [];

    for (const entry of serviceItemEntries) {
      const baseLabel = normalizeText(entry.item.name);
      if (baseLabel) entries.push({ key: entry.key, lookup: baseLabel });

      const labelWithRef = normalizeText(
        entry.item.reference ? `${entry.item.name} [${entry.item.reference}]` : entry.item.name
      );
      if (labelWithRef && labelWithRef !== baseLabel) {
        entries.push({ key: entry.key, lookup: labelWithRef });
      }
    }

    for (const entry of auxiliaryChecklistEntries) {
      const label = normalizeText(entry.itemLabel);
      if (label) entries.push({ key: entry.key, lookup: label });
    }

    return entries;
  }, [auxiliaryChecklistEntries, serviceItemEntries]);

  const resetEditorState = useCallback(() => {
    setEditingVerificationId(null);
    const initialForm = createInitialForm(coleteId);
    if (coleteData) {
      Object.assign(initialForm, {
        tecidoExterior: coleteData.tecidoExterior ?? "",
        colagens: coleteData.colagens ?? "",
        zataosVelcro: coleteData.zataosVelcro ?? "",
        fitasReflectoras: coleteData.fitasReflectoras ?? "",
        sistemaInflacao: coleteData.sistemaInflacao ?? "",
        mecanismoInflacao: coleteData.mecanismoInflacao ?? "",
        camaras: coleteData.camaras ?? "",
        garrafaCO2: coleteData.garrafaCO2 ?? "",
        tuboInflador: coleteData.tuboInflador ?? "",
        inspectorNome: coleteData.inspectorNome ?? "",
      });
    }
    setFormData(initialForm);
    setInflacaoDetalhes(createInitialInflacaoDetalhes(hasLight, hasClip));
    setManualChecklist({});
    setStockSearch({ capsula: "", cilindro: "", clip: "", luz: "" });
  }, [coleteId, hasClip, hasLight, coleteData]);

  const closeEditor = useCallback(() => {
    resetEditorState();
    setShowForm(false);
  }, [resetEditorState]);

  const openCreateForm = useCallback(() => {
    resetEditorState();
    setShowForm(true);
    window.requestAnimationFrame(() => {
      document.getElementById("colete-verificacao-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [resetEditorState]);

  const findManualChecklistKey = useCallback((label: string) => {
    const normalizedLabel = normalizeText(label);
    if (!normalizedLabel) return null;

    const exactMatch = checklistLookupEntries.find((entry) => entry.lookup === normalizedLabel);
    if (exactMatch) return exactMatch.key;

    const relaxedMatch = checklistLookupEntries.find((entry) => (
      entry.lookup.startsWith(normalizedLabel) || normalizedLabel.startsWith(entry.lookup)
    ));

    return relaxedMatch?.key || null;
  }, [checklistLookupEntries]);

  const startEditingVerification = useCallback((verification: VerificacaoColete) => {
    const parsedObservacoes = splitManualChecklistFromObservacoes(verification.observacoes);
    const parsedInflacaoDetalhes = parseInflacaoDetalhesFromObservacoes(verification.observacoes, hasLight, hasClip);

    const nextManualChecklist: Record<string, ManualChecklistState> = {};
    for (const line of parsedObservacoes.manualChecklistLines) {
      const key = findManualChecklistKey(line.itemLabel);
      if (!key) continue;
      nextManualChecklist[key] = {
        status: line.status,
        note: line.note,
      };
    }

    setEditingVerificationId(verification.id || null);
    setFormData({
      id: verification.id,
      coleteId,
      tecidoExterior: verification.tecidoExterior || "",
      colagens: verification.colagens || "",
      zataosVelcro: verification.zataosVelcro || "",
      fitasReflectoras: verification.fitasReflectoras || "",
      sistemaInflacao: verification.sistemaInflacao || "",
      mecanismoInflacao: verification.mecanismoInflacao || "",
      camaras: verification.camaras || "",
      garrafaCO2: verification.garrafaCO2 || "",
      tuboInflador: verification.tuboInflador || "",
      dataVerificacao: normalizeDateYmd(String(verification.dataVerificacao || "")),
      inspectorNome: verification.inspectorNome || "",
      observacoes: parsedObservacoes.plainObservacoes,
    });
    setInflacaoDetalhes(parsedInflacaoDetalhes);
    setManualChecklist(nextManualChecklist);
    setStockSearch({
      capsula: parsedInflacaoDetalhes.capsulaRef,
      cilindro: parsedInflacaoDetalhes.cilindro1Ref || parsedInflacaoDetalhes.cilindro2Ref,
      clip: parsedInflacaoDetalhes.clipRef,
      luz: parsedInflacaoDetalhes.luzRef,
    });
    setShowForm(true);

    window.requestAnimationFrame(() => {
      document.getElementById("colete-verificacao-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [coleteId, findManualChecklistKey, hasClip, hasLight]);

  useEffect(() => {
    setInflacaoDetalhes((prev) => ({
      ...createInitialInflacaoDetalhes(hasLight, hasClip),
      tipoMecanismo: prev.tipoMecanismo || "AUTOMATICO",
      capsulaSubstituida: prev.capsulaSubstituida,
      cilindro1Substituido: prev.cilindro1Substituido,
      cilindro2Substituido: prev.cilindro2Substituido,
      temClip: hasClip ? "SIM" : prev.temClip,
      clipRef: prev.clipRef,
      clipSubstituido: prev.clipSubstituido,
      temLuz: hasLight ? "SIM" : prev.temLuz,
      capsulaRef: prev.capsulaRef,
      capsulaValidade: prev.capsulaValidade,
      cilindro1Ref: prev.cilindro1Ref,
      cilindro1Validade: prev.cilindro1Validade,
      cilindro2Ref: prev.cilindro2Ref,
      cilindro2Validade: prev.cilindro2Validade,
      luzRef: prev.luzRef,
      luzValidade: prev.luzValidade,
      luzSubstituida: prev.luzSubstituida,
    }));
  }, [hasClip, hasLight, technicalModel?.model]);

  useEffect(() => {
    if (!recommendedMechanisms.length) return;
    setFormData((prev) => (
      String(prev.mecanismoInflacao || "").trim()
        ? prev
        : { ...prev, mecanismoInflacao: recommendedMechanisms[0] }
    ));
  }, [recommendedMechanisms]);

  useEffect(() => {
    if (!showForm) return;

    const controller = new AbortController();
    const requestId = ++stockRequestIdRef.current;

    const loadStockOptions = async () => {
      try {
        const mecanismoTokens = mechanismSearchTerms(formData.mecanismoInflacao);
        const capsuleSearch = Array.from(new Set([...mecanismoTokens, ...manualReferenceHints.capsuleKeywords]));
        const cylinderSearch = Array.from(new Set(["co2", "cilindro", "cylinder", ...manualReferenceHints.cylinderKeywords]));
        const clipSearch = Array.from(new Set(["clip", "safety clip", "toggle", "lanyard", ...manualReferenceHints.clipKeywords]));
        const lightSearch = Array.from(new Set(["luz", "light", "pylon", ...manualReferenceHints.lightKeywords]));

        const capsuleSearchRefs = Array.from(new Set([
          ...manualReferenceHints.capsuleRefs,
          ...extractReferenceTokens(stockSearch.capsula),
          stockSearch.capsula,
          inflacaoDetalhes.capsulaRef,
        ].filter(Boolean)));
        const cylinderSearchRefs = Array.from(new Set([
          ...manualReferenceHints.cylinderRefs,
          ...extractReferenceTokens(stockSearch.cilindro),
          stockSearch.cilindro,
          inflacaoDetalhes.cilindro1Ref,
          inflacaoDetalhes.cilindro2Ref,
        ].filter(Boolean)));
        const clipSearchRefs = Array.from(new Set([
          ...manualReferenceHints.clipRefs,
          ...extractReferenceTokens(stockSearch.clip),
          stockSearch.clip,
          inflacaoDetalhes.clipRef,
        ].filter(Boolean)));
        const lightSearchRefs = Array.from(new Set([
          ...manualReferenceHints.lightRefs,
          ...extractReferenceTokens(stockSearch.luz),
          stockSearch.luz,
          inflacaoDetalhes.luzRef,
        ].filter(Boolean)));

        const capsuleQuery = buildLimitedSearchQuery([
          ...capsuleSearch,
          ...extractReferenceTokens(stockSearch.capsula),
          stockSearch.capsula,
        ]);
        const cylinderQuery = buildLimitedSearchQuery([
          ...cylinderSearch,
          ...extractReferenceTokens(stockSearch.cilindro),
          stockSearch.cilindro,
        ]);
        const clipQuery = buildLimitedSearchQuery([
          ...clipSearch,
          ...extractReferenceTokens(stockSearch.clip),
          stockSearch.clip,
        ]);
        const lightQuery = buildLimitedSearchQuery([
          ...lightSearch,
          ...extractReferenceTokens(stockSearch.luz),
          stockSearch.luz,
        ]);

        const [capsulasRaw, cilindrosRaw, clipsRaw, luzesRaw] = await Promise.all([
          fetchStockOptions(`/api/stock?take=200&includeInactive=true&busca=${encodeURIComponent(capsuleQuery)}`, controller.signal),
          fetchStockOptions(`/api/stock?take=300&includeInactive=true&busca=${encodeURIComponent(cylinderQuery)}`, controller.signal),
          fetchStockOptions(`/api/stock?take=200&includeInactive=true&busca=${encodeURIComponent(clipQuery)}`, controller.signal),
          fetchStockOptions(`/api/stock?take=200&includeInactive=true&busca=${encodeURIComponent(lightQuery)}`, controller.signal),
        ]);

        if (controller.signal.aborted || requestId !== stockRequestIdRef.current) {
          return;
        }

        const scoreStockItem = (item: StockItemLite, refs: string[], keywords: string[]) => {
          const ref = String(item.referencia || "");
          const desc = String(item.descricao || "");
          const haystack = normalizeText(`${ref} ${desc}`);
          const refNormalized = normalizeRefToken(ref);
          let score = 0;

          for (const expectedRef of refs) {
            const expectedNormalized = normalizeRefToken(expectedRef);
            if (!expectedNormalized) continue;
            if (refNormalized === expectedNormalized) score += 120;
            else if (refNormalized.includes(expectedNormalized) || expectedNormalized.includes(refNormalized)) score += 80;
            else if (haystack.includes(normalizeText(expectedRef))) score += 40;
          }

          for (const keyword of keywords) {
            if (haystack.includes(normalizeText(keyword))) score += 10;
          }

          return score;
        };

        const capsulas = (Array.isArray(capsulasRaw) ? capsulasRaw : []).filter((item) => {
          const text = normalizeText(`${item?.referencia || ""} ${item?.descricao || ""}`);
          const matchesCapsuleKeywords = ["capsula", "capsule", "mk5", "sensor", "hammar", "inflator", "firing"].some((t) => text.includes(t));
          const matchesExplicitReference = hasReferenceMatch(item, [
            stockSearch.capsula,
            inflacaoDetalhes.capsulaRef,
            ...manualReferenceHints.capsuleRefs,
            ...extractReferenceTokens(stockSearch.capsula),
          ]);

          return matchesCapsuleKeywords || matchesExplicitReference;
        }).sort((a, b) => {
          const aScore = scoreStockItem(a, capsuleSearchRefs, [...mecanismoTokens, ...manualReferenceHints.capsuleKeywords]);
          const bScore = scoreStockItem(b, capsuleSearchRefs, [...mecanismoTokens, ...manualReferenceHints.capsuleKeywords]);
          return bScore - aScore;
        });

        const cilindros = (Array.isArray(cilindrosRaw) ? cilindrosRaw : []).filter((item) => {
          const text = normalizeText(`${item?.referencia || ""} ${item?.descricao || ""} ${item?.categoria || ""}`);
          const matchesCylinderKeywords = text.includes("co2") || text.includes("cilindro") || text.includes("cylinder");
          const matchesExplicitReference = hasReferenceMatch(item, [
            stockSearch.cilindro,
            inflacaoDetalhes.cilindro1Ref,
            inflacaoDetalhes.cilindro2Ref,
            ...manualReferenceHints.cylinderRefs,
            ...extractReferenceTokens(stockSearch.cilindro),
          ]);

          return matchesCylinderKeywords || matchesExplicitReference;
        }).sort((a, b) => {
          const aScore = scoreStockItem(a, cylinderSearchRefs, manualReferenceHints.cylinderKeywords);
          const bScore = scoreStockItem(b, cylinderSearchRefs, manualReferenceHints.cylinderKeywords);
          return bScore - aScore;
        });

        const luzes = (Array.isArray(luzesRaw) ? luzesRaw : []).filter((item) => {
          const text = normalizeText(`${item?.referencia || ""} ${item?.descricao || ""}`);
          const matchesLightKeywords = text.includes("luz") || text.includes("light") || text.includes("pylon");
          const matchesExplicitReference = hasReferenceMatch(item, [
            stockSearch.luz,
            inflacaoDetalhes.luzRef,
            ...manualReferenceHints.lightRefs,
            ...extractReferenceTokens(stockSearch.luz),
          ]);

          return matchesLightKeywords || matchesExplicitReference;
        }).sort((a, b) => {
          const aScore = scoreStockItem(a, lightSearchRefs, manualReferenceHints.lightKeywords);
          const bScore = scoreStockItem(b, lightSearchRefs, manualReferenceHints.lightKeywords);
          return bScore - aScore;
        });

        const clips = (Array.isArray(clipsRaw) ? clipsRaw : []).filter((item) => {
          const text = normalizeText(`${item?.referencia || ""} ${item?.descricao || ""} ${item?.categoria || ""}`);
          const matchesClipKeywords = text.includes("clip") || text.includes("toggle") || text.includes("lanyard") || text.includes("safety");
          const matchesExplicitReference = hasReferenceMatch(item, [
            stockSearch.clip,
            inflacaoDetalhes.clipRef,
            ...manualReferenceHints.clipRefs,
            ...extractReferenceTokens(stockSearch.clip),
          ]);

          return matchesClipKeywords || matchesExplicitReference;
        }).sort((a, b) => {
          const aScore = scoreStockItem(a, clipSearchRefs, manualReferenceHints.clipKeywords);
          const bScore = scoreStockItem(b, clipSearchRefs, manualReferenceHints.clipKeywords);
          return bScore - aScore;
        });

        const exactCapsule = findExactReferenceMatch(capsulas, [stockSearch.capsula]);
        const exactCylinder = findExactReferenceMatch(cilindros, [stockSearch.cilindro]);
        const exactClip = findExactReferenceMatch(clips, [stockSearch.clip]);
        const exactLight = findExactReferenceMatch(luzes, [stockSearch.luz]);

        if (controller.signal.aborted || requestId !== stockRequestIdRef.current) {
          return;
        }

        setStockCapsulas(capsulas);
        setStockCilindros(cilindros);
        setStockClips(clips);
        setStockLuzes(luzes);

        setInflacaoDetalhes((prev) => {
          const next = { ...prev };

          if (exactCapsule?.referencia) {
            next.capsulaRef = String(exactCapsule.referencia);
            next.capsulaValidade = normalizeDateYmd(exactCapsule.validade) || next.capsulaValidade;
          }

          if (!next.capsulaRef && capsulas[0]?.referencia) {
            next.capsulaRef = String(capsulas[0].referencia);
            next.capsulaValidade = next.capsulaValidade || normalizeDateYmd(capsulas[0]?.validade);
          }

          if (exactCylinder?.referencia) {
            const exactCylinderRef = String(exactCylinder.referencia);
            if (!next.cilindro1Ref || normalizeRefToken(stockSearch.cilindro) === normalizeRefToken(next.cilindro1Ref) || !findStockByReference(cilindros, next.cilindro1Ref)) {
              next.cilindro1Ref = exactCylinderRef;
              next.cilindro1Validade = normalizeDateYmd(exactCylinder.validade) || next.cilindro1Validade;
            }
          }

          if (!next.cilindro1Ref && cilindros[0]?.referencia) {
            next.cilindro1Ref = String(cilindros[0].referencia);
            next.cilindro1Validade = next.cilindro1Validade || normalizeDateYmd(cilindros[0]?.validade);
          }

          if (isTwinChamber && !next.cilindro2Ref) {
            const second = cilindros.find((item) => String(item.referencia || "") !== next.cilindro1Ref) || cilindros[1];
            if (second?.referencia) {
              next.cilindro2Ref = String(second.referencia);
              next.cilindro2Validade = next.cilindro2Validade || normalizeDateYmd(second?.validade);
            }
          }

          if (!next.temClip && hasClip) {
            next.temClip = "SIM";
          }

          if (exactClip?.referencia) {
            next.clipRef = String(exactClip.referencia);
          }

          if (next.temClip === "SIM" && !next.clipRef && clips[0]?.referencia) {
            next.clipRef = String(clips[0].referencia);
          }

          if (!next.temLuz && hasLight) {
            next.temLuz = "SIM";
          }

          if (exactLight?.referencia) {
            next.luzRef = String(exactLight.referencia);
            next.luzValidade = normalizeDateYmd(exactLight.validade) || next.luzValidade;
          }

          if (next.temLuz === "SIM" && !next.luzRef && luzes[0]?.referencia) {
            next.luzRef = String(luzes[0].referencia);
            next.luzValidade = next.luzValidade || normalizeDateYmd(luzes[0]?.validade);
          }

          return next;
        });
      } catch (error) {
        if (controller.signal.aborted || requestId !== stockRequestIdRef.current) {
          return;
        }

        const isAbortError = error instanceof DOMException && error.name === "AbortError";
        if (isAbortError) {
          return;
        }

        console.error("Erro a carregar referências de stock para checklist:", {
          error,
          mechanism: formData.mecanismoInflacao,
          stockSearch,
          coleteId,
        });
        setStockCapsulas([]);
        setStockCilindros([]);
        setStockClips([]);
        setStockLuzes([]);
      }
    };

    loadStockOptions();

    return () => {
      controller.abort();
    };
  }, [
    showForm,
    formData.mecanismoInflacao,
    manualReferenceHints,
    hasLight,
    inflacaoDetalhes.capsulaRef,
    inflacaoDetalhes.cilindro1Ref,
    inflacaoDetalhes.cilindro2Ref,
    inflacaoDetalhes.clipRef,
    inflacaoDetalhes.luzRef,
    isTwinChamber,
    stockSearch,
  ]);

  useEffect(() => {
    setManualChecklist((prev) => {
      let changed = false;
      const next: Record<string, ManualChecklistState> = { ...prev };
      for (const entry of serviceItemEntries) {
        if (!next[entry.key]) {
          next[entry.key] = { status: "", note: "" };
          changed = true;
        }
      }
      for (const entry of auxiliaryChecklistEntries) {
        if (!next[entry.key]) {
          next[entry.key] = { status: "", note: "" };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [auxiliaryChecklistEntries, serviceItemEntries]);

  useEffect(() => {
    const loadVerificacoes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/coletes/${coleteId}/verificacoes`);
        if (response.ok) {
          const data = await response.json();
          setVerificacoes(data);
        }
      } catch (error) {
        console.error("Error loading verificacoes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVerificacoes();
  }, [coleteId]);

  useEffect(() => {
    const loadColeteData = async () => {
      try {
        const response = await fetch(`/api/coletes/${coleteId}`);
        if (response.ok) {
          const data = await response.json();
          setColeteData(data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do colete:", error);
      }
    };
    loadColeteData();
  }, [coleteId]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const requiresSecondSystem = isTwinChamber;

    const serviceChecklistLines = serviceItemEntries
      .map(({ key, item }) => {
        const status = String(manualChecklist[key]?.status || "").trim();
        const note = String(manualChecklist[key]?.note || "").trim();
        if (!status && !note) return null;
        const refPart = item.reference ? ` [${item.reference}]` : "";
        return `- ${item.name}${refPart}: ${status || "SEM ESTADO"}${note ? ` · Nota: ${note}` : ""}`;
      })
      .filter(Boolean) as string[];

    const auxiliaryChecklistLines = auxiliaryChecklistEntries
      .map((entry) => {
        const status = String(manualChecklist[entry.key]?.status || "").trim();
        const note = String(manualChecklist[entry.key]?.note || "").trim();
        if (!status && !note) return null;
        return `- ${entry.itemLabel}: ${status || "SEM ESTADO"}${note ? ` · Nota: ${note}` : ""}`;
      })
      .filter(Boolean) as string[];

    const manualChecklistLines = [...serviceChecklistLines, ...auxiliaryChecklistLines];

    const observacoesBase = String(formData.observacoes || "").trim();
    const blocoSistemaInflacao = buildInflacaoBlock(formData, inflacaoDetalhes, requiresSecondSystem);
    const observacoesComChecklist = manualChecklistLines.length > 0
      ? [
          observacoesBase,
          "",
          blocoSistemaInflacao,
          "",
          MANUAL_CHECKLIST_MARKER,
          ...manualChecklistLines,
        ].filter(Boolean).join("\n")
      : [observacoesBase, "", blocoSistemaInflacao].filter(Boolean).join("\n");

    setIsSubmitting(true);

    try {
      const response = await fetch(
        isEditingVerification
          ? `/api/coletes/${coleteId}/verificacoes/${editingVerificationId}`
          : `/api/coletes/${coleteId}/verificacoes`,
        {
        method: isEditingVerification ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          observacoes: observacoesComChecklist,
        }),
      });

      if (response.ok) {
        const savedVerificacao = await response.json();

        try {
          const certificateResponse = await fetch(`/api/coletes/${coleteId}/certificado`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emitidoPor: formData.inspectorNome || undefined,
              observacoes: formData.observacoes || undefined,
              resultado: resolveCertificateResult(formData),
            }),
          });

          if (!certificateResponse.ok) {
            const certificatePayload = await certificateResponse.json().catch(() => ({}));
            console.error("Certificate sync returned non-OK after verificacao save:", certificatePayload);
          }
        } catch (error) {
          console.error("Error syncing certificado after verificacao save:", error);
        }

        setVerificacoes((prev) => {
          const next = [
            savedVerificacao,
            ...prev.filter((item) => item.id !== savedVerificacao.id),
          ];

          return next.sort((a, b) => {
            const aTime = new Date(a.dataVerificacao || 0).getTime();
            const bTime = new Date(b.dataVerificacao || 0).getTime();
            return bTime - aTime;
          });
        });
        closeEditor();
        await Promise.resolve(onSaved?.());
      } else {
        const payload = await response.json().catch(() => ({}));
        alert(payload?.message || "Não foi possível guardar a verificação do colete.");
      }
    } catch (error) {
      console.error("Error submitting verificacao:", error);
      alert("Ocorreu um erro ao guardar a verificação do colete.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "OK":
        return "bg-green-100 text-green-800";
      case "F":
        return "bg-red-100 text-red-800";
      case "S":
        return "bg-blue-100 text-blue-800";
      case "R":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const verificationStats = {
    total: verificacoes.length,
    falhas: verificacoes.filter((item) => [item.tecidoExterior, item.colagens, item.zataosVelcro, item.fitasReflectoras, item.sistemaInflacao, item.camaras, item.garrafaCO2, item.tuboInflador].includes("F")).length,
    substituidos: verificacoes.filter((item) => [item.tecidoExterior, item.colagens, item.zataosVelcro, item.fitasReflectoras, item.sistemaInflacao, item.camaras, item.garrafaCO2, item.tuboInflador].includes("S")).length,
    repaired: verificacoes.filter((item) => [item.tecidoExterior, item.colagens, item.zataosVelcro, item.fitasReflectoras, item.sistemaInflacao, item.camaras, item.garrafaCO2, item.tuboInflador].includes("R")).length,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-sky-50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-800">
                Checklist IM.022
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                Colete {coleteSerial}
              </span>
            </div>
            <h3 className="mt-3 text-xl font-bold text-slate-900">Checklist de inspeção do colete</h3>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Regista a inspeção visual, o mecanismo de insuflação e o histórico de intervenções com um fluxo operacional claro.
            </p>
            {technicalModel ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 font-medium text-cyan-900">
                  {brandCatalog?.brand} · {technicalModel.model}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                  {technicalModel.chamber}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                  {technicalModel.activation}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                  {serviceItems.length} item(ns) mapeados do manual
                </span>
              </div>
            ) : null}
          </div>
          <button
            onClick={() => {
              if (showForm) {
                closeEditor();
                return;
              }

              openCreateForm();
            }}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
          >
            {showForm ? (isEditingVerification ? "Cancelar edição" : "Cancelar") : "+ Nova verificação"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/70 bg-white/80 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Total</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{verificationStats.total}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-white/80 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-red-500">Falhas</p>
            <p className="mt-2 text-2xl font-bold text-red-700">{verificationStats.falhas}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white/80 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-blue-500">Substituições</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">{verificationStats.substituidos}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-white/80 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-500">Reparados</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{verificationStats.repaired}</p>
          </div>
        </div>

        {technicalModel ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.9fr)]">
            <div className="rounded-xl border border-cyan-200 bg-white/90 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">Checklist guiada pelo manual</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {fieldConfigs.filter((field) => field.linkedItems.length > 0).map((field) => (
                  <div key={field.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{field.label}</p>
                    <p className="mt-1 text-xs text-slate-600">{field.linkedItems.map((item) => item.name).join(" · ")}</p>
                  </div>
                ))}
              </div>
              {uncoveredMandatoryItems.length > 0 ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p className="font-semibold">Itens do manual sem campo dedicado</p>
                  <p className="mt-1">{uncoveredMandatoryItems.map((item) => item.name).join(" · ")} — podes registá-los nas observações se fizer sentido.</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-cyan-200 bg-white/90 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">Atenções técnicas</p>
              {technicalHighlights.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">Sem alertas adicionais para este modelo além da checklist base.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {technicalHighlights.map((item) => (
                    <li key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">• {item}</li>
                  ))}
                </ul>
              )}
              {recommendedMechanisms.length > 0 ? (
                <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                  <p className="font-semibold">Mecanismos mais prováveis para esta marca</p>
                  <p className="mt-1">{recommendedMechanisms.join(" · ")}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
            Sem correspondência automática de manual para este colete. A checklist continua disponível, mas sem guidance técnico específico por modelo.
          </div>
        )}
      </div>

      {showForm && (
        <div id="colete-verificacao-form" className="space-y-5 rounded-2xl border border-cyan-200 bg-white p-6 shadow-sm">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">
              {isEditingVerification ? "Editar verificação integrada do colete" : "Nova verificação integrada do colete"}
            </h4>
            <p className="mt-1 text-sm text-slate-600">
              {isEditingVerification
                ? "Altera campos já gravados, como o tipo de mecanismo, sem perder a checklist técnica associada."
                : "Preenche numa única etapa a inspeção individual e a checklist técnica do manual."}
            </p>
            {isEditingVerification && formData.dataVerificacao ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Estás a editar a verificação de {new Date(String(formData.dataVerificacao)).toLocaleDateString("pt-PT")}. Depois de gravar, o histórico e o dossiê são atualizados automaticamente.
              </div>
            ) : null}
            {technicalModel ? (
              <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
                <p className="font-semibold">Modelo reconhecido: {brandCatalog?.brand} · {technicalModel.model}</p>
                <p className="mt-1 text-xs text-cyan-800">
                  {technicalModel.serviceItems.length} item(ns) do manual · {technicalModel.certifications.join(" · ") || "Sem certificações mapeadas"}
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {fieldConfigs.map(({ key, label, helperText }) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <label className="block text-sm font-semibold text-slate-800">{label}</label>
                </div>
                {helperText ? <p className="mb-2 text-xs text-slate-500">{helperText}</p> : null}
                {key === "mecanismoInflacao" ? (
                  <select
                    value={String(formData[key] || "")}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">- Selecionar -</option>
                    {mechanismOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={String(formData[key] || "")}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">- Selecionar -</option>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {serviceItemsByField[key]?.length ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-800">Itens do manual ligados a este campo</p>
                    {serviceItemsByField[key].map((item) => {
                      const entryKey = serviceEntryKeyByItem.get(item);
                      if (!entryKey) return null;
                      const state = manualChecklist[entryKey] || { status: "", note: "" };

                      return (
                        <div key={entryKey} className="rounded-lg border border-cyan-200 bg-white p-2">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold text-slate-900">{item.name}</p>
                            {item.reference ? <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">{item.reference}</span> : null}
                            {item.mandatory ? <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">Manual</span> : null}
                          </div>
                          <div className="grid gap-2 md:grid-cols-[1fr_1fr]">
                            <select
                              value={state.status}
                              onChange={(e) => setManualChecklist((prev) => ({
                                ...prev,
                                [entryKey]: { ...(prev[entryKey] || { status: "", note: "" }), status: e.target.value },
                              }))}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              <option value="">- Estado item -</option>
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={state.note}
                              onChange={(e) => setManualChecklist((prev) => ({
                                ...prev,
                                [entryKey]: { ...(prev[entryKey] || { status: "", note: "" }), note: e.target.value },
                              }))}
                              placeholder="Nota do item"
                              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-800">Inspector</label>
              <input
                type="text"
                value={formData.inspectorNome || ""}
                onChange={(e) => setFormData({ ...formData, inspectorNome: e.target.value })}
                placeholder="Nome do inspector"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 xl:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-800">Observações</label>
              <textarea
                value={formData.observacoes || ""}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder={uncoveredMandatoryItems.length > 0
                  ? `Notas adicionais da inspeção... Regista também: ${uncoveredMandatoryItems.map((item) => item.name).join(", ")}`
                  : "Notas adicionais da inspeção..."}
                rows={4}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <h5 className="text-sm font-semibold text-sky-900">Passos do manual — Sistema de insuflação</h5>
            <p className="mt-1 text-xs text-sky-800">
              Registar cápsula, validade, garrafa(s) CO₂ e luz conforme o manual do modelo.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border border-sky-200 bg-white p-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Tipo do mecanismo</label>
                <select
                  value={inflacaoDetalhes.tipoMecanismo}
                  onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, tipoMecanismo: e.target.value as MechanismType }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="AUTOMATICO">Automático</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>

              {isAutomaticMechanism ? (
                <>
                  <div className="rounded-lg border border-sky-200 bg-white p-3 md:col-span-2 xl:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Referência da cápsula (stock)</label>
                    <input
                      type="text"
                      value={stockSearch.capsula}
                      onChange={(e) => setStockSearch((prev) => ({ ...prev, capsula: e.target.value }))}
                      placeholder="Pesquisar artigo no stock (ref/descrição)"
                      className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <select
                      value={inflacaoDetalhes.capsulaRef}
                      onChange={(e) => {
                        const selected = stockCapsulas.find((item) => String(item.referencia || "") === e.target.value);
                        setInflacaoDetalhes((prev) => ({
                          ...prev,
                          capsulaRef: e.target.value,
                          capsulaValidade: prev.capsulaValidade || normalizeDateYmd(selected?.validade),
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">- Selecionar cápsula -</option>
                      {stockCapsulas.map((item) => (
                        <option key={`caps-${item.id}`} value={String(item.referencia || "")}>{toStockLabel(item)}</option>
                      ))}
                    </select>
                    {inflacaoDetalhes.capsulaRef ? (() => {
                      const selected = findStockByReference(stockCapsulas, inflacaoDetalhes.capsulaRef);
                      return selected ? (
                        <a href={`/stock/${selected.id}`} className="mt-2 inline-block text-xs font-medium text-cyan-700 underline" target="_blank" rel="noreferrer">Abrir artigo no stock (#{selected.id})</a>
                      ) : null;
                    })() : null}
                  </div>

                  <div className="rounded-lg border border-sky-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Validade cápsula</label>
                    <input
                      type="date"
                      value={inflacaoDetalhes.capsulaValidade}
                      onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, capsulaValidade: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="rounded-lg border border-sky-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Cápsula substituída?</label>
                    <select
                      value={inflacaoDetalhes.capsulaSubstituida}
                      onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, capsulaSubstituida: e.target.value as ReplacementFlag }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {REPLACEMENT_OPTIONS.map((option) => (
                        <option key={`caps-repl-${option.value || 'blank'}`} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-sky-200 bg-white p-3 md:col-span-2 xl:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Cápsula automática</label>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Não aplicável quando o tipo do mecanismo é manual.
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-sky-200 bg-white p-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Garrafa CO₂ #1 (stock)</label>
                <input
                  type="text"
                  value={stockSearch.cilindro}
                  onChange={(e) => setStockSearch((prev) => ({ ...prev, cilindro: e.target.value }))}
                  placeholder="Pesquisar artigo no stock (ref/descrição)"
                  className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <select
                  value={inflacaoDetalhes.cilindro1Ref}
                  onChange={(e) => {
                    const selected = stockCilindros.find((item) => String(item.referencia || "") === e.target.value);
                    setInflacaoDetalhes((prev) => ({
                      ...prev,
                      cilindro1Ref: e.target.value,
                      cilindro1Validade: prev.cilindro1Validade || normalizeDateYmd(selected?.validade),
                    }));
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">- Selecionar garrafa #1 -</option>
                  {stockCilindros.map((item) => (
                    <option key={`co2a-${item.id}`} value={String(item.referencia || "")}>{toStockLabel(item)}</option>
                  ))}
                </select>
                {inflacaoDetalhes.cilindro1Ref ? (() => {
                  const selected = findStockByReference(stockCilindros, inflacaoDetalhes.cilindro1Ref);
                  return selected ? (
                    <a href={`/stock/${selected.id}`} className="mt-2 inline-block text-xs font-medium text-cyan-700 underline" target="_blank" rel="noreferrer">Abrir artigo no stock (#{selected.id})</a>
                  ) : null;
                })() : null}
              </div>

              <div className="rounded-lg border border-sky-200 bg-white p-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Validade garrafa #1</label>
                <input
                  type="date"
                  value={inflacaoDetalhes.cilindro1Validade}
                  onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, cilindro1Validade: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="rounded-lg border border-sky-200 bg-white p-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Garrafa #1 substituída?</label>
                <select
                  value={inflacaoDetalhes.cilindro1Substituido}
                  onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, cilindro1Substituido: e.target.value as ReplacementFlag }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {REPLACEMENT_OPTIONS.map((option) => (
                    <option key={`cyl1-repl-${option.value || 'blank'}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {isTwinChamber ? (
                <>
                  <div className="rounded-lg border border-sky-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Garrafa CO₂ #2 (stock)</label>
                    <select
                      value={inflacaoDetalhes.cilindro2Ref}
                      onChange={(e) => {
                        const selected = stockCilindros.find((item) => String(item.referencia || "") === e.target.value);
                        setInflacaoDetalhes((prev) => ({
                          ...prev,
                          cilindro2Ref: e.target.value,
                          cilindro2Validade: prev.cilindro2Validade || normalizeDateYmd(selected?.validade),
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">- Selecionar garrafa #2 -</option>
                      {stockCilindros.map((item) => (
                        <option key={`co2b-${item.id}`} value={String(item.referencia || "")}>{toStockLabel(item)}</option>
                      ))}
                    </select>
                    {inflacaoDetalhes.cilindro2Ref ? (() => {
                      const selected = findStockByReference(stockCilindros, inflacaoDetalhes.cilindro2Ref);
                      return selected ? (
                        <a href={`/stock/${selected.id}`} className="mt-2 inline-block text-xs font-medium text-cyan-700 underline" target="_blank" rel="noreferrer">Abrir artigo no stock (#{selected.id})</a>
                      ) : null;
                    })() : null}
                  </div>

                  <div className="rounded-lg border border-sky-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Validade garrafa #2</label>
                    <input
                      type="date"
                      value={inflacaoDetalhes.cilindro2Validade}
                      onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, cilindro2Validade: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="rounded-lg border border-sky-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Garrafa #2 substituída?</label>
                    <select
                      value={inflacaoDetalhes.cilindro2Substituido}
                      onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, cilindro2Substituido: e.target.value as ReplacementFlag }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {REPLACEMENT_OPTIONS.map((option) => (
                        <option key={`cyl2-repl-${option.value || 'blank'}`} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}

              <div className="rounded-lg border border-sky-200 bg-white p-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Tem clip de segurança?</label>
                <select
                  value={inflacaoDetalhes.temClip}
                  onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, temClip: e.target.value as "SIM" | "NAO" | "" }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={`clip-present-${option.value || 'blank'}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {inflacaoDetalhes.temClip === "SIM" ? (
                <>
                  <div className="rounded-lg border border-sky-200 bg-white p-3 md:col-span-2 xl:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Referência clip de segurança (stock)</label>
                    <input
                      type="text"
                      value={stockSearch.clip}
                      onChange={(e) => setStockSearch((prev) => ({ ...prev, clip: e.target.value }))}
                      placeholder="Pesquisar artigo no stock (ref/descrição)"
                      className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <select
                      value={inflacaoDetalhes.clipRef}
                      onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, clipRef: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">- Selecionar clip -</option>
                      {stockClips.map((item) => (
                        <option key={`clip-${item.id}`} value={String(item.referencia || "")}>{toStockLabel(item)}</option>
                      ))}
                    </select>
                    {inflacaoDetalhes.clipRef ? (() => {
                      const selected = findStockByReference(stockClips, inflacaoDetalhes.clipRef);
                      return selected ? (
                        <a href={`/stock/${selected.id}`} className="mt-2 inline-block text-xs font-medium text-cyan-700 underline" target="_blank" rel="noreferrer">Abrir artigo no stock (#{selected.id})</a>
                      ) : null;
                    })() : null}
                  </div>

                  <div className="rounded-lg border border-sky-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Clip substituído?</label>
                    <select
                      value={inflacaoDetalhes.clipSubstituido}
                      onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, clipSubstituido: e.target.value as ReplacementFlag }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {REPLACEMENT_OPTIONS.map((option) => (
                        <option key={`clip-repl-${option.value || 'blank'}`} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}

              <div className="rounded-lg border border-sky-200 bg-white p-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Tem luz?</label>
                <select
                  value={inflacaoDetalhes.temLuz}
                  onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, temLuz: e.target.value as "SIM" | "NAO" | "" }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={`light-present-${option.value || 'blank'}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {inflacaoDetalhes.temLuz === "SIM" ? (
                <>
                  <div className="rounded-lg border border-sky-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Referência luz (stock)</label>
                    <input
                      type="text"
                      value={stockSearch.luz}
                      onChange={(e) => setStockSearch((prev) => ({ ...prev, luz: e.target.value }))}
                      placeholder="Pesquisar artigo no stock (ref/descrição)"
                      className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <select
                      value={inflacaoDetalhes.luzRef}
                      onChange={(e) => {
                        const selected = stockLuzes.find((item) => String(item.referencia || "") === e.target.value);
                        setInflacaoDetalhes((prev) => ({
                          ...prev,
                          luzRef: e.target.value,
                          luzValidade: prev.luzValidade || normalizeDateYmd(selected?.validade),
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">- Selecionar luz -</option>
                      {stockLuzes.map((item) => (
                        <option key={`luz-${item.id}`} value={String(item.referencia || "")}>{toStockLabel(item)}</option>
                      ))}
                    </select>
                    {inflacaoDetalhes.luzRef ? (() => {
                      const selected = findStockByReference(stockLuzes, inflacaoDetalhes.luzRef);
                      return selected ? (
                        <a href={`/stock/${selected.id}`} className="mt-2 inline-block text-xs font-medium text-cyan-700 underline" target="_blank" rel="noreferrer">Abrir artigo no stock (#{selected.id})</a>
                      ) : null;
                    })() : null}
                  </div>

                  <div className="rounded-lg border border-sky-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Validade luz</label>
                    <input
                      type="date"
                      value={inflacaoDetalhes.luzValidade}
                      onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, luzValidade: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="rounded-lg border border-sky-200 bg-white p-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Luz substituída?</label>
                    <select
                      value={inflacaoDetalhes.luzSubstituida}
                      onChange={(e) => setInflacaoDetalhes((prev) => ({ ...prev, luzSubstituida: e.target.value as ReplacementFlag }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {REPLACEMENT_OPTIONS.map((option) => (
                        <option key={`light-repl-${option.value || 'blank'}`} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h5 className="text-sm font-semibold text-cyan-900">Verificações complementares</h5>
              <span className="text-xs text-cyan-800">Itens operacionais que devem ficar registados na verificação</span>
            </div>
            <div className="space-y-3">
              {auxiliaryChecklistEntries.map((entry) => {
                const state = manualChecklist[entry.key] || { status: "", note: "" };
                return (
                  <div key={entry.key} className="rounded-xl border border-cyan-200 bg-white p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{entry.itemLabel}</p>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Complementar
                      </span>
                    </div>
                    {entry.helperText ? <p className="mb-2 text-xs text-slate-600">{entry.helperText}</p> : null}
                    <div className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)]">
                      <select
                        value={state.status}
                        onChange={(e) => setManualChecklist((prev) => ({
                          ...prev,
                          [entry.key]: { ...(prev[entry.key] || { status: "", note: "" }), status: e.target.value },
                        }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">- Estado -</option>
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={state.note}
                        onChange={(e) => setManualChecklist((prev) => ({
                          ...prev,
                          [entry.key]: { ...(prev[entry.key] || { status: "", note: "" }), note: e.target.value },
                        }))}
                        placeholder="Nota opcional deste item"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {uncoveredManualEntries.length > 0 ? (
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h5 className="text-sm font-semibold text-cyan-900">Itens do manual sem campo dedicado</h5>
                <span className="text-xs text-cyan-800">Preencher estes itens adicionais para completar a verificação</span>
              </div>
              <div className="space-y-3">
                {uncoveredManualEntries.map(({ key, item }) => {
                  const state = manualChecklist[key] || { status: "", note: "" };
                  return (
                    <div key={key} className="rounded-xl border border-cyan-200 bg-white p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        {item.reference ? (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {item.reference}
                          </span>
                        ) : null}
                        {item.mandatory ? (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            Manual
                          </span>
                        ) : null}
                        {item.interval ? (
                          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700">
                            {item.interval}
                          </span>
                        ) : null}
                      </div>
                      {item.notes ? <p className="mb-2 text-xs text-slate-600">{item.notes}</p> : null}
                      <div className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)]">
                        <select
                          value={state.status}
                          onChange={(e) => setManualChecklist((prev) => ({
                            ...prev,
                            [key]: { ...(prev[key] || { status: "", note: "" }), status: e.target.value },
                          }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="">- Estado -</option>
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={state.note}
                          onChange={(e) => setManualChecklist((prev) => ({
                            ...prev,
                            [key]: { ...(prev[key] || { status: "", note: "" }), note: e.target.value },
                          }))}
                          placeholder="Nota opcional deste item"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
                <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                  {isSubmitting ? "A guardar..." : isEditingVerification ? "Guardar alterações" : "Guardar verificação"}
            </button>
            <button
                  onClick={closeEditor}
              disabled={isSubmitting}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          A carregar histórico de verificações...
        </div>
      ) : verificacoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          Nenhuma verificação registada. {showForm ? "" : "Cria a primeira verificação para iniciar o histórico."}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-slate-900">Histórico de inspeções</h4>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {verificacoes.length} registo{verificacoes.length === 1 ? "" : "s"}
            </span>
          </div>

          {verificacoes.map((v) => {
            const parsedObservacoes = splitManualChecklistFromObservacoes(v.observacoes);

            return (
            <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {v.dataVerificacao ? new Date(v.dataVerificacao).toLocaleDateString("pt-PT") : "Data não definida"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {v.inspectorNome ? `Inspector: ${v.inspectorNome}` : "Inspector não indicado"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {fieldConfigs.map(({ key, label }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
                    {v[key] ? (
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(String(v[key] || ""))}`}>
                        {String(v[key] || "")}
                      </span>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">—</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEditingVerification(v)}
                  className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-100"
                >
                  Editar verificação
                </button>
              </div>

              {parsedObservacoes.manualChecklistLines.length > 0 ? (
                <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700">
                  <p className="mb-2 font-semibold text-cyan-900">Checklist manual aplicada</p>
                  <div className="space-y-2">
                    {parsedObservacoes.manualChecklistLines.map((line, index) => (
                      <div key={`${line.itemLabel}:${index}`} className="rounded-lg border border-cyan-200 bg-white p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{line.itemLabel}</p>
                          {line.status ? (
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(line.status)}`}>
                              {line.status}
                            </span>
                          ) : null}
                        </div>
                        {line.note ? <p className="mt-1 text-xs text-slate-600">Nota: {line.note}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {parsedObservacoes.plainObservacoes ? (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
                  <p className="mb-1 font-semibold text-blue-900">Observações</p>
                  <p className="whitespace-pre-line">{parsedObservacoes.plainObservacoes}</p>
                </div>
              ) : null}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
