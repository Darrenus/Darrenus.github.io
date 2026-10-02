"""Rebuild the author's diagrams in English from the data shown in the Chinese edition.
Requires matplotlib. Source: Economic Scenarios for Transformative AI, Tables 3/6,
Sections 2/3.4. Original paper figures are reused without modification.
"""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import json
OUT=Path(__file__).resolve().parents[1]/'public/blog/ai-starts-working'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12,'axes.spines.top':False,'axes.spines.right':False,'axes.edgecolor':'#adb0b5','text.color':'#253029','axes.labelcolor':'#465148','xtick.color':'#465148','ytick.color':'#465148','savefig.facecolor':'white'})
COLORS=['#315f9d','#407a39','#b6543c']
def save(fig,n):
 fig.savefig(OUT/f'image{n}-en.png',dpi=160,bbox_inches='tight',pad_inches=.24);plt.close(fig)
# Framework, with room for full English labels.
fig,ax=plt.subplots(figsize=(14,8));ax.set(xlim=(0,14),ylim=(0,8));ax.axis('off')
ax.text(.1,7.65,'INPUTS: ASSUMPTIONS ABOUT AI',weight='bold',color=COLORS[0],fontsize=15)
ax.text(9.6,7.65,'OUTPUTS: THE 2030 ECONOMY',weight='bold',color=COLORS[1],fontsize=15)
inputs=[('Exposure · m','Share of tasks AI can affect'),('Adoption · d','Use within the exposed tasks'),('Productivity · a','Cost reduction per AI task'),('Automation share · ψ','Replacement vs. augmentation'),('New tasks · ρ','New tasks / automated tasks'),('Adjustment · μ and ξ','Switching frictions and wage rigidity')]
for i,(title,sub) in enumerate(inputs):
 y=6.4-i*1.05;ax.add_patch(FancyBboxPatch((.1,y),4.1,.85,boxstyle='round,pad=.1',fc='#eef3f9',ec=COLORS[0],lw=1.5));ax.text(.28,y+.53,title,weight='bold');ax.text(.28,y+.18,sub,fontsize=10)
 ax.add_patch(FancyArrowPatch((4.3,y+.42),(5.15,3.8),arrowstyle='->',mutation_scale=12,color='#a0a7ae'))
ax.add_patch(FancyBboxPatch((5.2,2),3.5,3.7,boxstyle='round,pad=.12',fc='#fff8ee',ec=COLORS[2],lw=1.7))
ax.text(6.95,5.1,'TASK-BASED MODEL',ha='center',weight='bold',fontsize=14)
for y,s in [(4.5,'Cognitive vs. other work'),(3.85,'Capital supply elasticity ε'),(3.2,'Search and matching'),(2.55,'Idea production')]:ax.text(6.95,y,s,ha='center',fontsize=11)
for i,(title,sub) in enumerate([('GDP and growth','How much the economy produces'),('Wages by occupation','Who earns more, and who earns less'),('Labour share / capital returns','How income is distributed'),('Employment and unemployment','Where workers move')]):
 y=6.1-i*1.45;ax.add_patch(FancyBboxPatch((9.7,y),4.1,1.05,boxstyle='round,pad=.1',fc='#eff6ee',ec=COLORS[1],lw=1.5));ax.text(9.85,y+.66,title,weight='bold',fontsize=11);ax.text(9.85,y+.23,sub,fontsize=10);ax.add_patch(FancyArrowPatch((8.85,3.8),(9.55,y+.5),arrowstyle='->',mutation_scale=12,color='#a0a7ae'))
ax.text(7,.25,'Not a forecast: each set of assumptions implies a different economic outcome.',ha='center',fontsize=12)
save(fig,2)
fig,axs=plt.subplots(1,3,figsize=(15,5.5));names=['Modest','Substantial','Transformative']
for ax,values,title,base in zip(axs,[[1.6,8.3,32.4],[59.4,56.1,45.2],[2.9,4.5,17.9]],['Additional GDP (%)','Labour share (%)','Cognitive unemployment (%)'],[0,60,2.9]):
 bars=ax.bar(names,values,color=COLORS,width=.58);ax.set_title(title,loc='left',fontsize=12,pad=20);ax.set_ylim(0,max(max(values),base)*1.16);ax.tick_params(axis='x',labelsize=9);ax.grid(axis='y',alpha=.2);ax.set_axisbelow(True);ax.bar_label(bars,fmt='%.1f',padding=5,weight='bold');
 if base:ax.axhline(base,color='#7c838b',ls='--',lw=1)
fig.suptitle('Three scenarios in 2030',x=.04,ha='left',fontsize=18,weight='bold');fig.text(.04,.01,'Source: paper, Table 3. Dashed lines indicate the no-AI baseline.',fontsize=10);fig.tight_layout(rect=(0,.04,1,.94));save(fig,3)
fig,ax=plt.subplots(figsize=(12,6));values=[81.4,33.6,.5,-11.5,-31];labels=['Capital income','Wages: other occupations','Total labour income','Wages: cognitive occupations','Total cognitive wage income'];bars=ax.barh(labels,values,color=[COLORS[1],COLORS[1],'#959ca4',COLORS[2],COLORS[2]],height=.55);ax.invert_yaxis();ax.axvline(0,color='#253029');ax.set_xlim(-46,96);ax.set_xlabel('Change from the no-AI baseline (%)');ax.bar_label(bars,labels=[f'{v:+.1f}%' for v in values],padding=7,weight='bold');ax.grid(axis='x',alpha=.2);ax.set_axisbelow(True);ax.set_title('Transformative scenario: a larger economy, a similar labour-income total',loc='left',fontsize=14,pad=20);fig.text(.02,.01,'Source: paper, Table 3. GDP is 32.4% above baseline; unemployed workers have zero wage income.',fontsize=9);fig.tight_layout(rect=(0,.04,1,1));save(fig,4)
fig,axs=plt.subplots(1,2,figsize=(13,5.8));labels=['0\nFlexible','0.5\nBaseline','0.75','0.9\nVery sticky']
for ax,values,title in zip(axs,[[-42.2,-11.5,-2.9,2.8],[2.6,17.9,21.7,24]],['Cognitive wage change vs. no AI (%)','Cognitive unemployment (%)']):
 bars=ax.bar(labels,values,color=[COLORS[1] if v>0 and values[0]<0 else COLORS[2] for v in values],width=.55);ax.axhline(0,color='#253029',lw=1);ax.bar_label(bars,fmt='%.1f',padding=5,weight='bold');ax.set_title(title,loc='left',fontsize=12,pad=18);ax.set_xlabel('Cognitive wage rigidity ξ');ax.grid(axis='y',alpha=.2);ax.set_axisbelow(True)
axs[0].set_ylim(-51,10);axs[1].set_ylim(0,28);axs[1].axhline(2.9,ls='--',color='#7c838b',lw=1)
fig.suptitle('The adjustment trade-off: lower wages or fewer jobs',x=.035,ha='left',weight='bold',fontsize=17);fig.text(.035,.01,'Source: paper, Table 6. Transformative scenario; baseline unemployment is 2.9%.',fontsize=10);fig.tight_layout(rect=(0,.04,1,.94));save(fig,6)
fig,ax=plt.subplots(figsize=(12,3.5));ax.set(xlim=(.43,.96),ylim=(0,1));ax.axis('off');ax.plot([.45,.95],[.5,.5],color='#d2d6da',lw=8,solid_capstyle='round')
for x,name,color,sub in zip([.5,.75,.9],names,COLORS,['About today’s chat usage','About today’s API usage','Agents become the norm']):
 ax.scatter([x],[.5],s=330,color=color,zorder=2);ax.text(x,.85,f'{name}\nψ = {x}',ha='center',color=color,weight='bold',fontsize=13);ax.text(x,.14,sub,ha='center',fontsize=11)
fig.suptitle('Automation share ψ: doing the work, rather than helping with it',x=.025,ha='left',weight='bold',fontsize=16);fig.text(.025,.015,'Source: paper, Section 3.4, citing the Anthropic Economic Index.',fontsize=10);fig.tight_layout(rect=(0,.08,1,.9));save(fig,9)
# Keep intrinsic dimensions accurate for stable layout while images load.
from PIL import Image
p=Path(__file__).resolve().parents[1]/'content/blog.en.json';records=json.loads(p.read_text())
for block in records[0]['blocks']:
 if block['type']=='figure':
  for n in [2,3,4,6,9]:
   if block['src'].endswith(f'/image{n}.png'):
    block['src']=block['src'].replace('.png','-en.png');block['width'],block['height']=Image.open(OUT/f'image{n}-en.png').size
p.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
