import { ipcService } from './ipc';

describe('IPCService', () => {
  beforeAll(() => {
    (window as any).electronAPI = { send: jest.fn() };
  });

  afterAll(() => {
    delete (window as any).electronAPI;
  });

  test('sendEditorInsertCode sends correct IPC message', () => {
    const code = 'console.log("hello");';
    ipcService.sendEditorInsertCode(code);
    expect((window as any).electronAPI.send).toHaveBeenCalledWith(
      'editor:insert-code',
      code
    );
  });

  test('chatWithAI invokes correct channel and returns response', async () => {
    const mockResponse = { success: true, response: 'ok' };
    (window as any).electronAPI.invoke = jest.fn().mockResolvedValue(mockResponse);

    const res = await ipcService.chatWithAI([{ role: 'user', content: 'hi' }]);
    expect(window.electronAPI.invoke).toHaveBeenCalledWith('ai:chat', [{ role: 'user', content: 'hi' }]);
    expect(res).toEqual(mockResponse);
  });

  test('readFile returns error when electronAPI not available', async () => {
    delete (window as any).electronAPI;
    const result = await ipcService.readFile('path');
    expect(result).toEqual({ success: false, error: 'Electron API not available' });
  });

  test('fileExists invokes correct channel and returns boolean', async () => {
    (window as any).electronAPI = { invoke: jest.fn().mockResolvedValue(true) };
    const exists = await ipcService.fileExists('/some/file');
    expect(window.electronAPI.invoke).toHaveBeenCalledWith('file:exists', '/some/file');
    expect(exists).toBe(true);
  });
});