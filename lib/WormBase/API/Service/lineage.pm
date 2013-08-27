package WormBase::API::Service::lineage;

use Moose;
with 'WormBase::API::Role::Object'; 
#extends 'WormBase::API::Object';
#extends 'WormBase::API';

use File::Spec::Functions;


=info

Cell lineage file is tab-delimited with the following format:
< after header row >
    Parent Cell 
    Interaction Type    
    Daughter Cell   
    Cell Common Name    
    Daughter Cell (No common names) 
    Parent Cell Generation  
    Node_size   
    Emb Term    
    Apoptoses   
    Emb Term Blast

=cut

has 'cl_datadir' => (
    is => 'ro',
    lazy => 1,
    default => sub {
        my $self = shift;
        return catdir($self->pre_compile->{base}, $self->ace_dsn->version,
                      'lineage/'.$self->cl_filename);
    }
);

has 'cl_filename' => (
    is => 'ro',
    lazy => 1, 
    default => 'Cell_lineage_Cytoscape.tab'
);

sub index{
	my $self = shift @_;
	#my $lineage_file_path = "/home/jdmswong/jdmswong-dev/files/lineage/Cell_lineage_Cytoscape.tab";
    my $lineage_file_path = $self->cl_datadir;
    open ( my $infile, $lineage_file_path ) 
        or die "Couldn't open $lineage_file_path: $!";
	
	my $limit_counter = 0; # DELETE
	
	my %cells = ();
	my @edges = ();
	
	<$infile>; # dump header row
	while(<$infile>){
        chomp;
        
        last if /^\s*$/;
	
        my @edge_key = qw(
            parent_cell
            int_type
            daughter_cell_id_common_name
            dcell_common_name
            dcell_id
            pcell_generation
            node_size   
            emb_term    
            apoptoses   
            emb_term_blast
        );
        
        #last if $limit_counter++ == 30; # DELETE
        
        my %row = map { shift @edge_key => $_ } split(/\t/);
        
        # Infer nodes
        if( defined $cells{parent_cell}){
            $cells{ $row{parent_cell} }{size} = $row{node_size};
            $cells{ $row{parent_cell} }{gen} = $row{pcell_generation};
        }else{
            $cells{ $row{parent_cell} } = { 
                id => $row{parent_cell},
                size => $row{node_size},
                gen => $row{pcell_generation}
            };
        }
        if( defined $cells{dcell_id}){
            $cells{ $row{dcell_id} }{name} = $row{dcell_common_name};
        }else{
            $cells{ $row{dcell_id} } = { 
                id => $row{dcell_id}, 
                name => $row{dcell_common_name} 
            };
        }
        $cells{ $row{dcell_id} }{gen} = $row{pcell_generation} + 1
            unless( defined $cells{ $row{dcell_id} }{gen} );
       
       my %edgeMap = ( map { $_ => $row{$_} } qw(
            parent_cell 
            dcell_id 
            int_type
            emb_term    
            apoptoses   
            emb_term_blast
        ) );
        $edgeMap{width} = (14 - $row{pcell_generation}) * 2;
       
        push( @edges, \%edgeMap);
	}
	
	
	my $data = {
        nodes => [map { $cells{$_} } keys %cells],
        edges => \@edges,
        #test => $self->cl_datadir,"::",$self->cl_filename
        test => 'asdf123'
    };
	
    #use Data::Dumper;
    #print Dumper($data);

	return $data;
}


1;
