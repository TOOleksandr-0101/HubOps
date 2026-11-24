import {beforeEach,describe,expect,test,vi} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {Workspace} from '../store/Workspace';
import {Assets} from './Assets';
import {Incidents} from './Incidents';

function renderWorkspace(page:React.ReactNode){return render(<MemoryRouter><Workspace>{page}</Workspace></MemoryRouter>);}

describe('engineering page workflows',()=>{
 beforeEach(()=>{localStorage.clear();vi.restoreAllMocks();});

 test('creates, edits, reads, and deletes an unlinked asset',async()=>{
  const user=userEvent.setup();
  vi.spyOn(window,'confirm').mockReturnValue(true);
  renderWorkspace(<Assets/>);

  await user.click(screen.getByRole('button',{name:'Add asset'}));
  await user.type(screen.getByLabelText('Name'),'QA Camera');
  await user.type(screen.getByLabelText('Manufacturer'),'Fictional QA');
  await user.type(screen.getByLabelText('Model'),'CAM-TEST');
  await user.type(screen.getByLabelText('Serial number'),'QA-SERIAL-001');
  await user.click(screen.getByRole('button',{name:'Save asset'}));

  const created=await screen.findByRole('heading',{name:'QA Camera'});
  const createdCard=created.closest('article');
  expect(createdCard).not.toBeNull();
  await user.click(within(createdCard!).getByRole('button',{name:'Edit'}));
  const name=screen.getByLabelText('Name');
  await user.clear(name);
  await user.type(name,'QA Camera Updated');
  await user.click(screen.getByRole('button',{name:'Save asset'}));

  const updated=await screen.findByRole('heading',{name:'QA Camera Updated'});
  const updatedCard=updated.closest('article');
  expect(updatedCard).not.toBeNull();
  await user.click(within(updatedCard!).getByRole('button',{name:'View record'}));
  const dialog=await screen.findByRole('dialog',{name:'QA Camera Updated'});
  expect(within(dialog).getByText('QA-SERIAL-001')).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button',{name:'Delete'}));
  await waitFor(()=>expect(screen.queryByRole('heading',{name:'QA Camera Updated'})).not.toBeInTheDocument());
 });

 test('creates, assigns, advances, and closes a manual incident',async()=>{
  const user=userEvent.setup();
  renderWorkspace(<Incidents/>);

  await user.click(screen.getByRole('button',{name:'Report incident'}));
  fireEvent.change(screen.getByLabelText('Title'),{target:{value:'QA manual incident'}});
  fireEvent.change(screen.getByLabelText('Description'),{target:{value:'A fictional issue created by the RTL workflow.'}});
  expect(screen.getByLabelText('Title')).toHaveValue('QA manual incident');
  await user.click(screen.getByRole('button',{name:'Save incident'}));

  await waitFor(()=>expect(screen.queryByRole('dialog',{name:'Report incident'})).not.toBeInTheDocument());
  const title=await screen.findByRole('heading',{name:'QA manual incident'});
  const ticket=title.closest('button');
  expect(ticket).not.toBeNull();
  await user.click(ticket!);
  let dialog=await screen.findByRole('dialog',{name:'QA manual incident'});
  expect(within(dialog).getByText('Manual report')).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button',{name:'Edit & assign'}));

  const editor=await screen.findByRole('dialog',{name:'Edit incident'});
  await user.selectOptions(within(editor).getByLabelText('Responsible employee'),'employee-2');
  await user.selectOptions(within(editor).getByLabelText('Priority'),'high');
  await user.selectOptions(within(editor).getByLabelText('Status'),'in-progress');
  await user.click(within(editor).getByRole('button',{name:'Save incident'}));

  dialog=await screen.findByRole('dialog',{name:'QA manual incident'});
  expect(within(dialog).getByText('Sam Patel')).toBeInTheDocument();
  expect(within(dialog).getByText('In Progress')).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button',{name:/^Close$/}));
  expect(await within(dialog).findByText('Closed')).toBeInTheDocument();
  expect(within(dialog).getByRole('button',{name:'Reopen'})).toBeInTheDocument();
 });
});
