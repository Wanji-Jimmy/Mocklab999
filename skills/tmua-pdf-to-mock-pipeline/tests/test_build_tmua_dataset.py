import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOD_PATH = ROOT / "scripts" / "build_tmua_dataset.py"

spec = importlib.util.spec_from_file_location("build_tmua_dataset", MOD_PATH)
mod = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules[spec.name] = mod
spec.loader.exec_module(mod)


class BuildTmuaDatasetTests(unittest.TestCase):
    def test_normalize_question(self):
        q = {
            "year": 2020,
            "paper": "1",
            "number": "2",
            "options": [{"key": "a", "text": "x"}, {"key": "", "text": "y"}],
        }
        out = mod.normalize_question(q)
        self.assertEqual(out["year"], "2020")
        self.assertEqual(out["paper"], 1)
        self.assertEqual(out["number"], 2)
        self.assertEqual(len(out["options"]), 1)
        self.assertEqual(out["options"][0]["key"], "A")

    def test_attach_answers(self):
        questions = [{"year": "2023", "paper": 1, "number": 1, "options": [{"key": "A", "text": "x"}], "stem": "s"}]
        answers = {"2023": {"1": {"1": "B"}}}
        explanations = {"2023": {"1": {"1": "exp"}}}
        updated = mod.attach_answers_and_explanations(questions, answers, explanations)
        self.assertEqual(updated, 1)
        self.assertEqual(questions[0]["answer"], "B")
        self.assertEqual(questions[0]["explanation"], "exp")

    def test_autofix_dedup_and_answer(self):
        questions = [
            {
                "year": "2023",
                "paper": 1,
                "number": 1,
                "stem": "abc\u0001",
                "explanation": "ok\ue001",
                "answer": "Z",
                "options": [{"key": "A", "text": "x"}, {"key": "A", "text": "dup"}],
            }
        ]
        stats = mod.apply_autofixes(questions)
        self.assertEqual(len(questions[0]["options"]), 1)
        self.assertEqual(questions[0]["answer"], "A")
        self.assertGreaterEqual(stats["dedupedOptions"], 1)
        self.assertGreaterEqual(stats["fixedAnswerKey"], 1)

    def test_validate_completeness_detects_missing(self):
        issues = mod.validate_completeness([])
        self.assertTrue(any("Expected 320 questions" in i for i in issues))


if __name__ == "__main__":
    unittest.main()
