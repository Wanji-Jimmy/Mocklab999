import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOD_PATH = ROOT / "scripts" / "extract_pdf_questions.py"

spec = importlib.util.spec_from_file_location("extract_pdf_questions", MOD_PATH)
mod = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules[spec.name] = mod
spec.loader.exec_module(mod)


class ExtractParserTests(unittest.TestCase):
    def test_parse_questions_simple_layout(self):
        raw = """
 
1 What is 1+1?
A 1
B 2
C 3

2 Choose letter
A A
B B
"""
        out = mod.parse_questions(mod.clean_text(raw), "sample.pdf")
        self.assertEqual(len(out), 2)
        self.assertEqual(out[0].number, 1)
        self.assertEqual(out[0].options[1].key, "B")

    def test_cid_ratio_detects_noise(self):
        text = "(cid:12) (cid:13) hello"
        ratio = mod.cid_ratio(text)
        self.assertGreater(ratio, 0.0)

    def test_normalize_math_text(self):
        s = "x squared and sqrt(x) ≤ 3 and sin x"
        out = mod.normalize_math_text(s)
        self.assertIn("x^2", out)
        self.assertIn("\\sqrt{x}", out)
        self.assertIn("\\leq", out)
        self.assertIn("\\sin", out)


if __name__ == "__main__":
    unittest.main()
