// Mock puppeteer for Jest tests to prevent loading native browser binaries and ESM parsing issues
module.exports = {
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      goto: jest.fn().mockResolvedValue(true),
      setContent: jest.fn().mockResolvedValue(true),
      pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock')),
      close: jest.fn().mockResolvedValue(true)
    }),
    close: jest.fn().mockResolvedValue(true)
  })
};
