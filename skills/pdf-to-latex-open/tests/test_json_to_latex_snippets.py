import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOD_PATH = ROOT / "scripts" / "json_to_latex_snippets.py"

spec = importlib.util.spec_from_file_location("json_to_latex_snippets", MOD_PATH)
mod = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules[spec.name] = mod
spec.loader.exec_module(mod)


class JsonToLatexTests(unittest.TestCase):
    def test_emit_tex_with_stem_and_options(self):
        payload = [
            {
                "stem": "Find x",
                "options": [
                    {"key": "A", "text": "1"},
                    {"key": "B", "text": "2"},
                ],
            }
        ]
        tex = mod.emit_tex(payload)
        self.assertIn("Question 1", tex)
        self.assertIn("Find x", tex)
        self.assertIn("[A]", tex)

    def test_latex_escape(self):
        escaped = mod.latex_escape("a_b & c%")
        self.assertIn("a\\_b", escaped)
        self.assertIn("\\&", escaped)
        self.assertIn("\\%", escaped)


if __name__ == "__main__":
    unittest.main()
