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

  return new Response(JSON.stringify({ project, nodes, edges }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
