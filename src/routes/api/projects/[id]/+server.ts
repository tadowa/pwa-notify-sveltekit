import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const GET: RequestHandler = async ({ params }) => {
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single();

  const { data: nodes } = await supabase
    .from('nodes')
    .select('*')
    .eq('project_id', params.id);

  const { data: edges } = await supabase
    .from('edges')
    .select('*')
    .eq('project_id', params.id);

  // tasks を node_id ごとに取得
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .in('node_id', nodes?.map(n => n.id) || []);

  return new Response(JSON.stringify({ project, nodes, edges, tasks }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
