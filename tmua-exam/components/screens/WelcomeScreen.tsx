interface WelcomeScreenProps {
  onResetProgress?: () => void
}

export default function WelcomeScreen({ onResetProgress }: WelcomeScreenProps) {
  return (
    <main className="max-w-5xl mx-auto">
      <div className="mx-auto mb-6 h-32 w-32 rounded-full border-2 border-[#016daa] bg-white grid place-items-center">
        <div className="text-2xl font-black text-[#016daa] tracking-tight">TMUA</div>
      </div>

      <p className="mb-4 text-sm">
        Welcome to the <span className="font-bold">Test of Mathematics for University Admission.</span>
      </p>
      <p className="mb-4 text-sm">
        Non-disclosure agreement and general terms of use for tests developed for UAT-UK:
      </p>
      <p className="mb-4 text-sm leading-relaxed">
        The test is made available to you as a candidate solely for the purpose of being assessed in this test. You
        are expressly prohibited from disclosing, publishing, reproducing or transmitting this test, in whole or in
        part, in any form or by any means including visual, verbal, written, electronic or mechanical means, for any
        purpose, without the prior express written permission of UAT-UK.
      </p>
      <p className="mb-6 text-sm">
        Click the <span className="font-bold">Next (N)</span> button when you are ready to begin the test.
      </p>

      {onResetProgress && (
        <div className="mb-4">
          <button
            onClick={onResetProgress}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Reset Progress
          </button>
        </div>
      )}
    </main>
  )
}
