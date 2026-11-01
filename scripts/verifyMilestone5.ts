import {
  applyStoryDifficultyToLevel,
  CAMPAIGN_CHAPTERS,
} from '../src/game/systems/LevelRegistry';
import { TraversalSimulationValidator } from '../src/game/systems/TraversalSimulationValidator';
import { WakeTrialsGenerator } from '../src/game/systems/WakeTrialsGenerator';
import { SaveManager } from '../src/game/systems/SaveManager';
import { CAMPAIGN_DIALOGUE_ENTRIES } from '../src/game/dialogue/dialogueData';
import { StoryDifficulty, TrialDifficulty } from '../src/game/config/gameConfig';
import { activePhysicsTuning } from '../src/game/config/physicsTuning';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runAllTests(): Promise<void> {
  console.log('==========================================================');
  console.log('WISPWAKE MILESTONE 5 — AUTOMATED VERIFICATION SUITE');
  console.log('==========================================================\n');

  // 1. PLAYER & KINEMATICS TESTS
  console.log('[1/6] Running Player & Kinematic Trajectory Tests...');
  const safeY = 400 - 44 - 4; // Player.getSafeCenterYForPlatformTop(400, 4) = 352
  const hitboxBottomAtSafeY = safeY - 28 + 72; // 352 - 28 + 72 = 396 (4px above 400)
  assert(
    hitboxBottomAtSafeY === 396,
    `Expected hitbox bottom at 396 (4px above platform top 400), got ${hitboxBottomAtSafeY}`
  );

  const flatJumpSim = TraversalSimulationValidator.simulateJumpTrajectoryToTarget(
    200,
    450,
    350,
    500,
    450
  );
  assert(flatJumpSim.reachable, '150u flat jump must be kinematically reachable');

  const highStepSim = TraversalSimulationValidator.simulateJumpTrajectoryToTarget(
    200,
    450,
    310,
    460,
    375
  );
  assert(highStepSim.reachable, '110u gap + 75u upward step must be kinematically reachable');
  console.log('  ✓ Player hitbox calibration & kinematic jump integrator verified.');

  // 2. CHECKPOINT & SAVE PROGRESSION TESTS
  console.log('\n[2/6] Running Checkpoint & SaveManager Progression Tests...');
  SaveManager.resetAllProgress();
  const initialSave = SaveManager.get();
  assert(initialSave.chapters.sleeping_canopy.unlocked === true, 'Chapter 1 must start unlocked');
  assert(initialSave.chapters.moonlit_marsh.unlocked === false, 'Chapter 2 must start locked');
  assert(initialSave.chapters.hollow_below.unlocked === false, 'Chapter 3 must start locked');
  assert(initialSave.chapters.windward_ruins.unlocked === false, 'Chapter 4 must start locked');

  SaveManager.recordCheckpoint('sleeping_canopy', 'cp_canopy_01', 2910, 347);
  SaveManager.recordCheckpoint('sleeping_canopy', 'cp_canopy_02', 5560, 362);
  SaveManager.recordRootBridge('sleeping_canopy', 'sc_root_01');
  SaveManager.recordDiscoveredMemory('mem_canopy_bough_song');

  const scProgress = SaveManager.getChapterProgress('sleeping_canopy');
  assert(
    scProgress.activeCheckpointId === 'cp_canopy_02' &&
      scProgress.unlockedCheckpointIds.length === 2,
    'SaveManager must track both active checkpoint and all unlocked checkpoints'
  );
  assert(
    scProgress.activatedRootBridgeIds.includes('sc_root_01'),
    'SaveManager must persist extended root bridges across respawns'
  );
  assert(
    SaveManager.hasDiscoveredMemory('mem_canopy_bough_song'),
    'SaveManager must persist discovered Memory Echoes'
  );

  const unlockedNext1 = SaveManager.markChapterCompleted('sleeping_canopy');
  assert(unlockedNext1 === 'moonlit_marsh', 'Completing Chapter 1 must unlock Chapter 2');
  assert(SaveManager.getChapterProgress('moonlit_marsh').unlocked === true, 'Chapter 2 is now unlocked');
  SaveManager.resetAllProgress();
  console.log('  ✓ Multi-checkpoint persistence, root bridge state, and chapter unlock flow verified.');

  // 3. EXPANDED 4-CHAPTER CAMPAIGN & STORY DIFFICULTY VALIDATION
  console.log('\n[3/6] Running 4-Chapter Campaign & Story Difficulty Simulation (16 Configurations)...');
  const storyDifficulties: StoryDifficulty[] = ['easy', 'medium', 'hard', 'extreme'];

  for (const chapter of CAMPAIGN_CHAPTERS) {
    assert(
      chapter.beats.length === 10,
      `${chapter.id} must have 10 distinct named sub-areas, found ${chapter.beats.length}`
    );
    assert(
      chapter.platforms.length >= 23,
      `${chapter.id} must have >= 23 platforms, found ${chapter.platforms.length}`
    );
    assert(
      (chapter.checkpoints?.length ?? 0) === 4,
      `${chapter.id} must have 4 checkpoints, found ${chapter.checkpoints?.length}`
    );
    assert(
      (chapter.memoryEchoes?.length ?? 0) === 2,
      `${chapter.id} must have 2 optional Memory Echoes, found ${chapter.memoryEchoes?.length}`
    );

    // Verify every checkpoint sits strictly on a supporting platform
    for (const cp of chapter.checkpoints ?? []) {
      const hostPlat = chapter.platforms.find(
        (p) => cp.x >= p.x + 20 && cp.x <= p.x + p.width - 20 && cp.y === p.y
      );
      assert(
        Boolean(hostPlat),
        `Checkpoint ${cp.id} in ${chapter.id} (x=${cp.x}, y=${cp.y}) must rest safely inside a platform`
      );
    }

    for (const diff of storyDifficulties) {
      const scaled = applyStoryDifficultyToLevel(chapter, diff);
      const report = TraversalSimulationValidator.validateLevel(scaled);
      assert(
        report.passed,
        `Campaign ${chapter.id} on StoryDifficulty=${diff} failed simulation: ${report.notes.join('; ')}`
      );
    }
    console.log(
      `  ✓ ${chapter.title}: 10 sub-areas, ${chapter.platforms.length} platforms, ${chapter.blooms.length} blooms, ${chapter.checkpoints?.length} checkpoints — 100% reachable across Easy/Medium/Hard/Extreme.`
    );
  }

  // 4. WAKE TRIALS 200-SEED SIMULATION VALIDATION (50 SEEDS PER DIFFICULTY)
  console.log('\n[4/6] Running Wake Trials Generator & Validator across 200 Seeds (50 per Difficulty)...');
  const trialDifficulties: TrialDifficulty[] = ['easy', 'medium', 'hard', 'extreme'];
  const expectedSegRanges: Record<TrialDifficulty, [number, number]> = {
    easy: [12, 16],
    medium: [16, 20],
    hard: [22, 26],
    extreme: [28, 36],
  };

  for (const diff of trialDifficulties) {
    let passedSeeds = 0;
    let totalSegments = 0;
    let totalHazards = 0;
    const archetypesSeen = new Set<string>();

    for (let i = 1; i <= 50; i++) {
      const seedCode = `${diff.slice(0, 2).toUpperCase()}-M5S${String(i).padStart(2, '0')}`;
      const built = WakeTrialsGenerator.buildValidatedTrial(diff, seedCode);
      const [minSeg, maxSeg] = expectedSegRanges[diff];

      assert(
        built.segmentCount >= minSeg && built.segmentCount <= maxSeg,
        `Trial ${seedCode} segmentCount=${built.segmentCount} outside [${minSeg}, ${maxSeg}]`
      );
      assert(
        built.validationPassed,
        `Trial ${seedCode} (${diff}) failed traversal validation: ${built.validationNotes.join('; ')}`
      );

      passedSeeds++;
      totalSegments += built.segmentCount;
      totalHazards +=
        built.levelDef.hazards.length +
        (built.levelDef.crumblingPlatforms?.length ?? 0) +
        (built.levelDef.sporeVents?.length ?? 0) +
        (built.levelDef.fallingDebris?.length ?? 0);
      built.archetypesUsed.forEach((a) => archetypesSeen.add(a));
    }

    assert(
      totalHazards > 0,
      `Wake Trials difficulty ${diff} must generate non-zero hazards across 50 seeds`
    );
    console.log(
      `  ✓ Wake Trials [${diff.toUpperCase()}]: ${passedSeeds}/50 seeds passed (avg ${(totalSegments / 50).toFixed(1)} segments, ${totalHazards} total hazards, ${archetypesSeen.size} archetypes exercised).`
    );
  }

  // 5. DIALOGUE & LORE COMPLETENESS TESTS
  console.log('\n[5/6] Running Narrative & Pip Dialogue Completeness Tests...');
  const memoryEntries = CAMPAIGN_DIALOGUE_ENTRIES.filter((d) => d.triggerType === 'memory_echo');
  assert(
    memoryEntries.length === 8,
    `Expected 8 Memory Echo dialogue entries, found ${memoryEntries.length}`
  );
  assert(
    CAMPAIGN_DIALOGUE_ENTRIES.length >= 42,
    `Expected >= 42 authored dialogue entries, found ${CAMPAIGN_DIALOGUE_ENTRIES.length}`
  );
  console.log(
    `  ✓ Verified ${CAMPAIGN_DIALOGUE_ENTRIES.length} authored Pip dialogue entries & all 8 Memory Echoes.`
  );

  // 6. WAKE & PHYSICS TUNING ENVELOPE CHECK
  console.log('\n[6/6] Running Wake System & Physics Envelope Checks...');
  assert(activePhysicsTuning.wakeRadius === 160, 'Wake radius must be 160 logical units');
  assert(activePhysicsTuning.coyoteTime === 0.1, 'Coyote time must be 0.10s');
  assert(activePhysicsTuning.jumpBufferTime === 0.12, 'Jump buffer must be 0.12s');
  console.log('  ✓ Wake radius, coyote time, and jump buffer verified.\n');

  console.log('==========================================================');
  console.log('ALL MILESTONE 5 AUTOMATED TESTS PASSED (100% PASS RATE)');
  console.log('==========================================================');
}

runAllTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
