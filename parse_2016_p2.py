#!/usr/bin/env python3
"""Parse 2016 Paper 2 LaTeX and generate question JSON"""

import re
import json

latex_content = open('/Users/moji/Desktop/tmua/679ccde2-578a-4cd5-962e-a450a2d005a3/679ccde2-578a-4cd5-962e-a450a2d005a3.tex').read()

# Manual parsing based on the LaTeX structure
questions_data = [
    # Q1
    {
        "num": 1,
        "stem": "Find the value of\n$$\\int_{1}^{2}\\left(x^{2}-\\frac{4}{x^{2}}\\right)^{2} d x$$",
        "options": [
            {"key": "A", "latex": "$\\frac{43}{15}$"},
            {"key": "B", "latex": "$3$"},
            {"key": "C", "latex": "$\\frac{97}{15}$"},
            {"key": "D", "latex": "$\\frac{103}{15}$"},
            {"key": "E", "latex": "$\\frac{163}{15}$"},
            {"key": "F", "latex": "$18$"}
        ],
        "images": []
    },
    # Q2
    {
        "num": 2,
        "stem": "$$f(x)=\\frac{\\left(x^{2}+5\\right)(2 x)}{\\sqrt[4]{x^{3}}}, \\quad x>0$$\nWhich one of the following is equal to $f^{\\prime}(x)$ ?",
        "options": [
            {"key": "A", "latex": "$8 x^{\\frac{9}{4}}+\\frac{40}{3} x^{\\frac{1}{4}}$"},
            {"key": "B", "latex": "$\\frac{9}{2} x^{\\frac{5}{4}}+\\frac{5}{2} x^{-\\frac{3}{4}}$"},
            {"key": "C", "latex": "$8 x^{\\frac{9}{4}}+\\frac{40}{3} x^{-\\frac{1}{4}}$"},
            {"key": "D", "latex": "$\\frac{8}{13} x^{\\frac{13}{4}}+8 x^{\\frac{5}{4}}$"}
        ],
        "images": []
    },
    # Q3
    {
        "num": 3,
        "stem": "What is the value, in radians, of the largest angle $x$ in the range $0 \\leq x \\leq 2 \\pi$ that satisfies the equation $8 \\sin ^{2} x+4 \\cos ^{2} x=7$ ?",
        "options": [
            {"key": "A", "latex": "$\\frac{2 \\pi}{3}$"},
            {"key": "B", "latex": "$\\frac{5 \\pi}{6}$"},
            {"key": "C", "latex": "$\\frac{4 \\pi}{3}$"},
            {"key": "D", "latex": "$\\frac{5 \\pi}{3}$"},
            {"key": "E", "latex": "$\\frac{7 \\pi}{4}$"},
            {"key": "F", "latex": "$\\frac{11 \\pi}{6}$"}
        ],
        "images": []
    },
    # Q4
    {
        "num": 4,
        "stem": "Five sealed urns, labelled P, Q, R, S, and T, each contain the same (non-zero) number of balls. The following statements are attached to the urns.\n\nUrn P This urn contains one or four balls.\\\nUrn Q This urn contains two or four balls.\\\nUrn R This urn contains more than two balls and fewer than five balls.\\\nUrn S This urn contains one or two balls.\\\nUrn T This urn contains fewer than three balls.\n\nExactly one of the urns has a true statement attached to it.\\\nWhich urn is it?",
        "options": [
            {"key": "A", "latex": "Urn P"},
            {"key": "B", "latex": "Urn Q"},
            {"key": "C", "latex": "Urn R"},
            {"key": "D", "latex": "Urn S"},
            {"key": "E", "latex": "Urn T"}
        ],
        "images": []
    },
    # Q5
    {
        "num": 5,
        "stem": "Consider the statement:\\\n(*) A whole number $n$ is prime if it is 1 less or 5 less than a multiple of 6 .\\\nHow many counterexamples to (*) are there in the range $0<n<50$ ?",
        "options": [
            {"key": "A", "latex": "$2$"},
            {"key": "B", "latex": "$3$"},
            {"key": "C", "latex": "$4$"},
            {"key": "D", "latex": "$5$"},
            {"key": "E", "latex": "$6$"}
        ],
        "images": []
    },
    # Q6
    {
        "num": 6,
        "stem": "The sequence of functions $f_{1}(x), f_{2}(x), f_{3}(x), \\ldots$ is defined as follows:\n\n$$\\begin{aligned}\nf_{1}(x) & =x^{10} \\\\\nf_{n+1}(x) & =x f_{n}^{\\prime}(x) \\text { for } n \\geq 1\n\\end{aligned}$$\n\nwhere $f_{n}^{\\prime}(x)=\\frac{d f_{n}(x)}{d x}$\n\nFind the value of\n\n$$\\sum_{n=1}^{20} f_{n}(x)$$",
        "options": [
            {"key": "A", "latex": "$\\frac{x^{10}\\left(x^{20}-1\\right)}{x-1}$"},
            {"key": "B", "latex": "$\\frac{x^{10}\\left(x^{21}-1\\right)}{x-1}$"},
            {"key": "C", "latex": "$\\left(\\frac{10^{20}-1}{9}\\right) x^{10}$"},
            {"key": "D", "latex": "$\\left(\\frac{10^{21}-1}{9}\\right) x^{10}$"},
            {"key": "E", "latex": "$\\left(\\frac{(10 x)^{20}-1}{10 x-1}\\right) x^{10}$"},
            {"key": "F", "latex": "$\\left(\\frac{(10 x)^{21}-1}{10 x-1}\\right) x^{10}$"},
            {"key": "G", "latex": "$x^{10}+x^{9}+x^{8}+\\cdots+x+1$"},
            {"key": "H", "latex": "$x^{10}+10 x^{9}+(10 \\times 9) x^{8}+\\cdots+(10 \\times 9 \\times \\ldots \\times 2) x+(10 \\times 9 \\times \\ldots \\times 2 \\times 1)$"}
        ],
        "images": []
    },
    # Q7
    {
        "num": 7,
        "stem": "The four real numbers $a, b, c$, and $d$ are all greater than 1 .\\\nSuppose that they satisfy the equation $\\log _{c} d=\\left(\\log _{a} b\\right)^{2}$.\\\nUse some of the lines given to construct a proof that, in this case, it follows that\n\n$$(*) \\log _{b} d=\\left(\\log _{a} b\\right)\\left(\\log _{a} c\\right)$$\n\n(1) Let $x=\\log _{a} b$ and $y=\\log _{a} c$\\\n(2) $d=\\left(c^{x}\\right)^{2}$\\\n(3) $d=c^{\\left(x^{2}\\right)}$\\\n(4) $d=b^{x y}$\\\n(5) $d=\\left(a^{y}\\right)^{\\left(x^{2}\\right)}$\\\n(6) $d=\\left(\\left(a^{y}\\right)^{x}\\right)^{2}$\\\n(7) $d=\\left(a^{x}\\right)^{x y}$\\\n(8) $d=a^{\\left(y^{2 x}\\right)}$\\\n(9) $d=a^{\\left(x^{2} y\\right)}$",
        "options": [
            {"key": "A", "latex": "(1). Then (2), so (6), so (8), so (7), and therefore (4), hence (*) as required."},
            {"key": "B", "latex": "(1). Then (2), so (7), so (8), so (6), and therefore (4), hence (*) as required."},
            {"key": "C", "latex": "(1). Then (3), so (5), so (9), so (7), and therefore (4), hence (*) as required."},
            {"key": "D", "latex": "(1). Then (3), so (7), so (9), so (5), and therefore (4), hence (*) as required."},
            {"key": "E", "latex": "(1). Then (4), so (5), so (9), so (7), and therefore (3), hence (*) as required."},
            {"key": "F", "latex": "(1). Then (4), so (6), so (8), so (7), and therefore (2), hence (*) as required."},
            {"key": "G", "latex": "(1). Then (4), so (7), so (8), so (6), and therefore (2), hence (*) as required."},
            {"key": "H", "latex": "(1). Then (4), so (7), so (9), so (5), and therefore (3), hence (*) as required."}
        ],
        "images": []
    },
    # Q8
    {
        "num": 8,
        "stem": "A region is defined by the inequalities $x+y>6$ and $x-y>-4$\\\nConsider the three statements:\\\n$1 x>1$\\\n$2 y>5$\\\n$3(x+y)(x-y)>-24$\n\nWhich of the above statements is/are true for every point in the region?",
        "options": [
            {"key": "A", "latex": "none"},
            {"key": "B", "latex": "1 only"},
            {"key": "C", "latex": "2 only"},
            {"key": "D", "latex": "3 only"},
            {"key": "E", "latex": "1 and 2 only"},
            {"key": "F", "latex": "1 and 3 only"},
            {"key": "G", "latex": "2 and 3 only"},
            {"key": "H", "latex": "1, 2 and 3"}
        ],
        "images": []
    },
    # Q9
    {
        "num": 9,
        "stem": "Triangles $A B C$ and $X Y Z$ have the same area.\\\nWhich of these extra conditions, taken independently, would imply that they are congruent?\\\n(1) $A B=X Y$ and $B C=Y Z$\\\n(2) $A B=X Y$ and $\\angle A B C=\\angle X Y Z$\\\n(3) $\\angle A B C=\\angle X Y Z$ and $\\angle B C A=\\angle Y Z X$\n\n[Table showing options A-H with conditions (1), (2), (3) as rows]",
        "options": [
            {"key": "A", "latex": "Does not imply / Does not imply / Does not imply"},
            {"key": "B", "latex": "Does not imply / Does not imply / Implies congruent"},
            {"key": "C", "latex": "Does not imply / Implies congruent / Does not imply"},
            {"key": "D", "latex": "Does not imply / Implies congruent / Implies congruent"},
            {"key": "E", "latex": "Implies congruent / Does not imply / Does not imply"},
            {"key": "F", "latex": "Implies congruent / Does not imply / Implies congruent"},
            {"key": "G", "latex": "Implies congruent / Implies congruent / Does not imply"},
            {"key": "H", "latex": "Implies congruent / Implies congruent / Implies congruent"}
        ],
        "images": []
    },
    # Q10
    {
        "num": 10,
        "stem": "In this question $x$ and $y$ are non-zero real numbers.\\\nWhich one of the following is sufficient to conclude that $x<y$ ?",
        "options": [
            {"key": "A", "latex": "$x^{4}<y^{4}$"},
            {"key": "B", "latex": "$y^{4}<x^{4}$"},
            {"key": "C", "latex": "$x^{-1}<y^{-1}$"},
            {"key": "D", "latex": "$y^{-1}<x^{-1}$"},
            {"key": "E", "latex": "$x^{\\frac{3}{5}}<y^{\\frac{3}{5}}$"},
            {"key": "F", "latex": "$y^{\\frac{3}{5}}<x^{\\frac{3}{5}}$"}
        ],
        "images": []
    },
    # Q11
    {
        "num": 11,
        "stem": "$f(x)$ is a polynomial with real coefficients.\\\nThe equation $f(x)=0$ has exactly two real roots, $x=-p$ and $x=p$, where $p>0$.\\\nConsider the following three statements:\\\n$1 \\quad f^{\\prime}(x)=0$ for exactly one value of $x$ between $-p$ and $p$\\\n$2$ The area between the curve $y=f(x)$, the $x$-axis and the lines $x=-p$ and $x=p$ is given by $2 \\int_{0}^{p} f(x) \\mathrm{d} x$\\\n$3$ The graph of $y=-f(-x)$ intersects the $x$-axis at the points $x=-p$ and $x=p$ only\n\nWhich of the above statements must be true?",
        "options": [
            {"key": "A", "latex": "none"},
            {"key": "B", "latex": "1 only"},
            {"key": "C", "latex": "2 only"},
            {"key": "D", "latex": "3 only"},
            {"key": "E", "latex": "1 and 2 only"},
            {"key": "F", "latex": "1 and 3 only"},
            {"key": "G", "latex": "2 and 3 only"},
            {"key": "H", "latex": "1, 2 and 3"}
        ],
        "images": []
    },
    # Q12
    {
        "num": 12,
        "stem": "The first term of an arithmetic sequence is $a$ and the common difference is $d$.\\\nThe sum of the first $n$ terms is denoted by $S_{n}$.\\\nIf $S_{8}>3 S_{6}$, what can be deduced about the sign of $a$ and the sign of $d$ ?",
        "options": [
            {"key": "A", "latex": "both $a$ and $d$ are negative"},
            {"key": "B", "latex": "$a$ is positive, $d$ is negative"},
            {"key": "C", "latex": "$a$ is negative, $d$ is positive"},
            {"key": "D", "latex": "$a$ is negative, but the sign of $d$ cannot be deduced"},
            {"key": "E", "latex": "$d$ is negative, but the sign of $a$ cannot be deduced"},
            {"key": "F", "latex": "neither the sign of $a$ nor the sign of $d$ can be deduced"}
        ],
        "images": []
    },
    # Q13
    {
        "num": 13,
        "stem": "In this question, $a, b$, and $c$ are positive integers.\\\nThe following is an attempted proof of the false statement:\\\nIf $a$ divides $b c$, then $a$ divides $b$ or $a$ divides $c$.\\[0pt]\n[' $a$ divides $b c$ ' means ' $a$ is a factor of $b c$ ']\\\nWhich line contains the error in this proof?\n\n1. The statement is equivalent to if $a$ does not divide $b$ and $a$ does not divide $c$ then $a$ does not divide $b c^{\\prime}$.\n2. Suppose $a$ does not divide $b$ and $a$ does not divide $c$. Then the remainder when dividing $b$ by $a$ is $r$, where $0<r<a$, and the remainder when dividing $c$ by $a$ is $s$, where $0<s<a$.\n3. So $b=a x+r$ and $c=a y+s$ for some integers $x$ and $y$.\n4. Thus $b c=a(a x y+x s+y r)+r s$.\n5. So the remainder when dividing $b c$ by $a$ is $r s$.\n6. Since $r>0$ and $s>0$, it follows that $r s>0$.\n7. Hence $a$ does not divide $b c$.",
        "options": [
            {"key": "A", "latex": "Line 1"},
            {"key": "B", "latex": "Line 2"},
            {"key": "C", "latex": "Line 3"},
            {"key": "D", "latex": "Line 4"},
            {"key": "E", "latex": "Line 5"},
            {"key": "F", "latex": "Line 6"}
        ],
        "images": []
    },
    # Q14
    {
        "num": 14,
        "stem": "$f(x)=a x^{4}+b x^{3}+c x^{2}+d x+e$, where $a, b, c, d$, and $e$ are real numbers.\\\nSuppose $f(x)=1$ has $p$ distinct real solutions, $f(x)=2$ has $q$ distinct real solutions, $f(x)=3$ has $r$ distinct real solutions, and $f(x)=4$ has $s$ distinct real solutions.\n\nWhich one of the following is not possible?",
        "options": [
            {"key": "A", "latex": "$p=1, q=2, r=4$ and $s=3$"},
            {"key": "B", "latex": "$p=1, q=3, r=2$ and $s=4$"},
            {"key": "C", "latex": "$p=1, q=4, r=3$ and $s=2$"},
            {"key": "D", "latex": "$p=2, q=4, r=3$ and $s=1$"},
            {"key": "E", "latex": "$p=4, q=3, r=2$ and $s=1$"}
        ],
        "images": []
    },
    # Q15
    {
        "num": 15,
        "stem": "Consider the quadratic $f(x)=x^{2}-2 p x+q$ and the statement:\\\n$\\left(^{*}\\right) f(x)=0$ has two real roots whose difference is greater than 2 and less than 4.\\\nWhich one of the following statements is true if and only if (*) is true?",
        "options": [
            {"key": "A", "latex": "$q<p^{2}<q+4$"},
            {"key": "B", "latex": "$\\sqrt{q+1}<p<\\sqrt{q+4}$"},
            {"key": "C", "latex": "$q-3 \\leq p^{2}-4 \\leq q$"},
            {"key": "D", "latex": "$q<p^{2}-1<q+3$"},
            {"key": "E", "latex": "$q-2<p^{2}-3<q+2$"}
        ],
        "images": []
    },
    # Q16
    {
        "num": 16,
        "stem": "In the figure, $P Q R S$ is a trapezium with $P Q$ parallel to $S R$.\\\nThe diagonals of the trapezium meet at $X$.\\\n$U$ lies on $S P$ and $T$ lies on $R Q$ such that $U T$ is a line segment through $X$ parallel to $P Q$.\n\nThe length of $P Q$ is 12 cm and the length of $S R$ is 3 cm .\\\nWhat, in centimetres, is the length of UT?",
        "options": [
            {"key": "A", "latex": "$4.2$"},
            {"key": "B", "latex": "$4.5$"},
            {"key": "C", "latex": "$4.8$"},
            {"key": "D", "latex": "$5.25$"},
            {"key": "E", "latex": "$6$"}
        ],
        "images": ["/extracted_images/679ccde2-578a-4cd5-962e-a450a2d005a3-15_780_1040_221_283.jpg"]
    },
    # Q17
    {
        "num": 17,
        "stem": "Consider these simultaneous equations, where $c$ is a constant:\n\n$$\\begin{aligned}\n& y=3 \\sin x+2 \\\\\n& y=x+c\n\\end{aligned}$$\n\nWhich of the following statements is/are true?\n\n1 For some value of $c$ : there is exactly one solution with $0 \\leq x \\leq \\pi$ and there is at least one solution with $-\\pi<x<0$.\n\n2 For some value of $c$ : there is exactly one solution with $0 \\leq x \\leq \\pi$ and there are no solutions with $-\\pi<x<0$.\n\n3 For some value of $c$ : there is exactly one solution with $0 \\leq x \\leq \\pi$ and there are no solutions with $x>\\pi$.",
        "options": [
            {"key": "A", "latex": "none"},
            {"key": "B", "latex": "1 only"},
            {"key": "C", "latex": "2 only"},
            {"key": "D", "latex": "3 only"},
            {"key": "E", "latex": "1 and 2 only"},
            {"key": "F", "latex": "1 and 3 only"},
            {"key": "G", "latex": "2 and 3 only"},
            {"key": "H", "latex": "1, 2 and 3"}
        ],
        "images": []
    },
    # Q18
    {
        "num": 18,
        "stem": "Consider this statement about a function $f(x)$ :\\\n$\\left(^{*}\\right)$ If $(f(x))^{2} \\leq 1$ for all $-1 \\leq x \\leq 1$ then $\\int_{-1}^{1}(f(x))^{2} \\mathrm{~d} x \\leq \\int_{-1}^{1} f(x) \\mathrm{d} x$\n\nWhich one of the following functions provides a counterexample to (*)?",
        "options": [
            {"key": "A", "latex": "$f(x)=x+\\frac{1}{2}$"},
            {"key": "B", "latex": "$f(x)=x-\\frac{1}{2}$"},
            {"key": "C", "latex": "$f(x)=x+x^{3}$"},
            {"key": "D", "latex": "$f(x)=x-x^{3}$"},
            {"key": "E", "latex": "$f(x)=x^{2}+x^{4}$"},
            {"key": "F", "latex": "$f(x)=x^{2}-x^{4}$"}
        ],
        "images": []
    },
    # Q19
    {
        "num": 19,
        "stem": "Some identical unit cubes are used to construct a three-dimensional object by gluing them together face to face.\n\nSketches of this object are made by looking at it from the right-hand side, from the front and from above. These sketches are called the side elevation, the front elevation, and the plan view respectively.\\\n[Side elevation image]\\\nThis is the side elevation of the object.\\\n[Front elevation image]\\\nThis is the front elevation of the object.\\\n[Plan view image]\\\nThis is the plan view of the object.\n\nHow many cubes were used to construct the object?",
        "options": [
            {"key": "A", "latex": "exactly 6"},
            {"key": "B", "latex": "either 6 or 7"},
            {"key": "C", "latex": "exactly 7"},
            {"key": "D", "latex": "either 7 or 8"},
            {"key": "E", "latex": "exactly 8"},
            {"key": "F", "latex": "either 8 or 9"},
            {"key": "G", "latex": "exactly 9"}
        ],
        "images": [
            "/extracted_images/679ccde2-578a-4cd5-962e-a450a2d005a3-18_200_202_575_486.jpg",
            "/extracted_images/679ccde2-578a-4cd5-962e-a450a2d005a3-18_200_196_794_488.jpg",
            "/extracted_images/679ccde2-578a-4cd5-962e-a450a2d005a3-18_197_202_1014_486.jpg"
        ]
    },
    # Q20
    {
        "num": 20,
        "stem": "Each interior angle of a regular polygon with $n$ sides is $\\frac{3}{4}$ of each interior angle of a second regular polygon with $m$ sides.\n\nHow many pairs of positive integers $n$ and $m$ are there for which this statement is true?",
        "options": [
            {"key": "A", "latex": "none"},
            {"key": "B", "latex": "$1$"},
            {"key": "C", "latex": "$2$"},
            {"key": "D", "latex": "$3$"},
            {"key": "E", "latex": "$4$"},
            {"key": "F", "latex": "$5$"},
            {"key": "G", "latex": "$6$"},
            {"key": "H", "latex": "infinitely many"}
        ],
        "images": []
    }
]

# Save to JSON
with open('/Users/moji/Desktop/tmua/2016_p2_parsed.json', 'w') as f:
    json.dump(questions_data, f, indent=2)

print(f"Parsed {len(questions_data)} questions")
for q in questions_data:
    print(f"Q{q['num']}: {len(q['options'])} options, {len(q['images'])} images")
