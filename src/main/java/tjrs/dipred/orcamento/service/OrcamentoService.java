package tjrs.dipred.orcamento.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import tjrs.dipred.orcamento.dto.ComarcaDTO;
import tjrs.dipred.orcamento.dto.GrupoDTO;
import tjrs.dipred.orcamento.dto.ItemDTO;
import tjrs.dipred.orcamento.dto.LoteDTO;
import tjrs.dipred.orcamento.dto.SubgrupoDTO;
import tjrs.dipred.orcamento.model.Comarca;
import tjrs.dipred.orcamento.model.Grupo;
import tjrs.dipred.orcamento.model.Item;
import tjrs.dipred.orcamento.model.Lote;
import tjrs.dipred.orcamento.model.PrecoItem;
import tjrs.dipred.orcamento.model.Subgrupo;
import tjrs.dipred.orcamento.repository.ComarcaRepository;
import tjrs.dipred.orcamento.repository.GrupoRepository;
import tjrs.dipred.orcamento.repository.ItemRepository;
import tjrs.dipred.orcamento.repository.LoteRepository;
import tjrs.dipred.orcamento.repository.PrecoItemRepository;
import tjrs.dipred.orcamento.repository.SubgrupoRepository;

@Service
public class OrcamentoService {

    private final ComarcaRepository comarcaRepository;
    private final LoteRepository loteRepository;
    private final GrupoRepository grupoRepository;
    private final SubgrupoRepository subgrupoRepository;
    private final ItemRepository itemRepository;
    private final PrecoItemRepository precoItemRepository;

    public OrcamentoService(ComarcaRepository comarcaRepository,
                             LoteRepository loteRepository,
                             GrupoRepository grupoRepository,
                             SubgrupoRepository subgrupoRepository,
                             ItemRepository itemRepository,
                             PrecoItemRepository precoItemRepository) {
        this.comarcaRepository = comarcaRepository;
        this.loteRepository = loteRepository;
        this.grupoRepository = grupoRepository;
        this.subgrupoRepository = subgrupoRepository;
        this.itemRepository = itemRepository;
        this.precoItemRepository = precoItemRepository;
    }

    public List<ComarcaDTO> listarComarcas() {
        return comarcaRepository.findAllByOrderByNomeAsc().stream()
                .map(this::paraComarcaDTO)
                .toList();
    }

    public List<LoteDTO> listarLotes() {
        return loteRepository.findAllByOrderByNumeroAsc().stream()
                .map(this::paraLoteDTO)
                .toList();
    }

    public List<GrupoDTO> listarItensOrcamento() {
        return grupoRepository.findAllByOrderByIdAsc().stream()
                .map(this::paraGrupoDTO)
                .toList();
    }

    public void atualizarPreco(String codigoItem, Integer numeroLote, BigDecimal valor) {
        PrecoItem preco = precoItemRepository.findByItem_CodigoAndLote_Numero(codigoItem, numeroLote)
                .orElseThrow(() -> new RuntimeException(
                        "Preço não encontrado para o item " + codigoItem + " no lote " + numeroLote));
        preco.setValor(valor);
        precoItemRepository.save(preco);
    }

    private ComarcaDTO paraComarcaDTO(Comarca comarca) {
        return new ComarcaDTO(comarca.getNome(), comarca.getLote().getNumero(), comarca.getRegiao());
    }

    private LoteDTO paraLoteDTO(Lote lote) {
        return new LoteDTO(lote.getNumero(), lote.getEmpresa(), lote.getContrato(), lote.getRegioes());
    }

    private GrupoDTO paraGrupoDTO(Grupo grupo) {
        List<SubgrupoDTO> subgrupos = subgrupoRepository.findAllByGrupoOrderByIdAsc(grupo).stream()
                .map(this::paraSubgrupoDTO)
                .toList();
        return new GrupoDTO(grupo.getCodigo(), grupo.getNome(), subgrupos);
    }

    private SubgrupoDTO paraSubgrupoDTO(Subgrupo subgrupo) {
        List<ItemDTO> itens = itemRepository.findAllBySubgrupoOrderByIdAsc(subgrupo).stream()
                .map(this::paraItemDTO)
                .toList();
        return new SubgrupoDTO(subgrupo.getCodigo(), subgrupo.getNome(), itens, subgrupo.getVirtual());
    }

    private ItemDTO paraItemDTO(Item item) {
        List<BigDecimal> precos = precoItemRepository.findAllByItemOrderByLote_NumeroAsc(item).stream()
                .map(PrecoItem::getValor)
                .toList();
        return new ItemDTO(item.getCodigo(), item.getDescricao(), item.getUnidade(), precos);
    }
}
