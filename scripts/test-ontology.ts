import { loadOntologyStores } from '@/lib/ontology/loader';
import {
  getSocialStudiesCurriculum,
  getGagnéEvents,
  getPISATextAttributes,
  getReadingFunctionsAndStrategies,
} from '@/lib/ontology/queries';
import {
  inferTextTypesForContentElements,
  inferReadingFunctionsForTextType,
  recommendStrategiesForFunctions,
  slotStrategiesIntoGagneEvents,
} from '@/lib/ontology/inference';

async function runTests() {
  console.log('=== OBILD Ontology Engine Verification ===\n');

  // 1. Loader Test
  const stores = await loadOntologyStores();
  console.log('1. Store Triple Counts:');
  console.log('   - Social Studies:', stores.tripleCounts.social);
  console.log('   - Gagne:', stores.tripleCounts.gagne);
  console.log('   - Text (PISA):', stores.tripleCounts.text);
  console.log('   - Reading Strategy:', stores.tripleCounts.read);
  console.log('   - Total combined triples:', stores.tripleCounts.total);

  if (stores.tripleCounts.total < 100) {
    throw new Error('Triple count too low, parsing might have failed');
  }

  // 2. Curriculum Query Test
  const curriculum = await getSocialStudiesCurriculum();
  console.log('\n2. Curriculum Extraction:');
  console.log('   - Subject:', curriculum.label);
  console.log('   - Learning Areas Count:', curriculum.areas.length);
  console.log('   - Areas:', curriculum.areas.map((a) => a.label).join(', '));
  console.log('   - Competencies:', curriculum.competencies.map((c) => c.label).join(', '));

  if (curriculum.areas.length !== 11) {
    throw new Error(`Expected 11 learning areas, found ${curriculum.areas.length}`);
  }

  // 3. Gagné Events Test
  const gagneEvents = await getGagnéEvents();
  console.log('\n3. Gagné 9 Instructional Events:');
  console.log('   - Events Count:', gagneEvents.length);
  for (const e of gagneEvents) {
    console.log(`     [${e.sequenceNumber}] ${e.label} (Strategy: ${e.strategyLabel || 'N/A'})`);
  }

  if (gagneEvents.length !== 9) {
    throw new Error(`Expected 9 Gagné events, found ${gagneEvents.length}`);
  }

  // 4. PISA Text Types Test
  const textAttrs = await getPISATextAttributes();
  console.log('\n4. PISA Text Attributes Count:', textAttrs.length);

  // 5. Reading Functions Test
  const readingFns = await getReadingFunctionsAndStrategies();
  console.log('\n5. Reading Functions Count:', readingFns.length);

  // 6. Inference Test
  console.log('\n6. Inference Pipeline Test:');
  const politicsArea = curriculum.areas.find((a) => a.id === 'Politics');
  if (!politicsArea) throw new Error('Politics area not found');

  const selectedElems = politicsArea.contentElements.slice(0, 2);
  console.log('   - Selected Content Elements:', selectedElems.map((e) => `${e.label} (${e.type})`).join(', '));

  const inferredTextTypes = inferTextTypesForContentElements(selectedElems);
  console.log('   - Inferred Text Types:', inferredTextTypes.join(', '));

  const inferredFunctions = inferReadingFunctionsForTextType(inferredTextTypes[0]);
  console.log(`   - Inferred Reading Functions for ${inferredTextTypes[0]}:`, inferredFunctions.join(', '));

  const recommendedStrats = recommendStrategiesForFunctions(inferredFunctions, readingFns);
  console.log('   - Recommended Strategies Count:', recommendedStrats.length);
  console.log('   - Top Strategies:', recommendedStrats.slice(0, 5).map((s) => s.label).join(', '));

  const gagnePlan = slotStrategiesIntoGagneEvents(
    gagneEvents,
    recommendedStrats.slice(0, 2),
    politicsArea.contentElements[0].label,
    '민주주의와 선거에 관한 중학교 교육용 읽기자료'
  );

  console.log('\n7. Gagné Slotting Result (Sample Event 1 & 5):');
  console.log(`   - Event 1: ${gagnePlan[0].label} -> ${gagnePlan[0].description}`);
  console.log(`   - Event 5: ${gagnePlan[4].label} -> ${gagnePlan[4].description}`);

  console.log('\n>>> All Ontology Engine Tests PASSED successfully! <<<');
}

runTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
