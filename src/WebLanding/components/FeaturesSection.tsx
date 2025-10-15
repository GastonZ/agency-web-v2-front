const FeaturesSection = () => {
  return (
    <section className="w-full flex justify-center py-16 px-4 font-sans">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <article className="bg-[#090909]/50 border border-[#1F1F1F] rounded-lg p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/52d1c544b477add36a4ff4ea7f175ebf14f0c4b6?placeholderIfAbsent=true"
                className="w-4 h-4"
                alt="AI Rag icon"
              />
              <span className="text-base text-[#a1a1a1] font-normal">AI Rag</span>
            </div>
            <h3 
              className="text-white text-2xl font-bold leading-8 tracking-[-0.96px] mb-4">
              Launch smarter apps in no time.
            </h3>
            <p className="text-lg text-[#a1a1a1] font-normal tracking-[-0.05px] leading-6 mb-6">
              Empower your tools with adaptive AI workflows built to scale instantly.
            </p>
            <div className="flex-1 flex items-end">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/5776299e78761bfb96d58956661304c4d123fbf9?placeholderIfAbsent=true"
                className="w-full aspect-[1.32] object-contain rounded"
                alt="Feature illustration"
              />
            </div>
          </article>

          <article className="bg-[#090909]/50 border border-[#1F1F1F] rounded-lg p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/aa55b64a894aa7a402d1dc596aa153c1ac6ed30d?placeholderIfAbsent=true"
                className="w-4 h-4"
                alt="Vector API icon"
              />
              <span className="text-base text-[#a1a1a1] font-normal">Vector API</span>
            </div>
            <h3
              className="text-white text-2xl font-bold leading-8 tracking-[-0.96px] mb-4">
              Built to scale, ready to impress.
            </h3>
            <p className="text-lg text-[#a1a1a1] font-normal tracking-[-0.05px] leading-6 mb-6">
              Power next-gen applications with real-time adaptive intelligence.
            </p>
            <div className="flex-1 flex items-end">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/a37df8567da23bcfba87fe16aa2ae92b5f9676c1?placeholderIfAbsent=true"
                className="w-full aspect-[1.32] object-contain rounded"
                alt="Feature illustration"
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
